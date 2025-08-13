import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

function extractAgentName(chatData: any, lastMessage: any): string {
  console.log("🔍 === EXTRAINDO NOME DO AGENTE ===")
  console.log("📊 LastOrganizationMember:", JSON.stringify(chatData.LastOrganizationMember, null, 2))
  console.log("📊 OrganizationMembers:", JSON.stringify(chatData.OrganizationMembers, null, 2))
  console.log("📊 Setor:", chatData.Setor)

  // 1. Tentar usar LastOrganizationMember.Id para buscar em OrganizationMembers
  if (chatData.LastOrganizationMember?.Id && chatData.OrganizationMembers) {
    const memberId = chatData.LastOrganizationMember.Id
    console.log("🔍 Procurando membro com ID:", memberId)

    const member = chatData.OrganizationMembers.find((m: any) => m.Id === memberId)
    if (member) {
      console.log("✅ Membro encontrado:", JSON.stringify(member, null, 2))

      // Tentar Name primeiro, depois DisplayName
      if (member.Name) {
        console.log("✅ Nome do agente encontrado:", member.Name)
        return member.Name
      }
      if (member.DisplayName) {
        console.log("✅ DisplayName do agente encontrado:", member.DisplayName)
        return member.DisplayName
      }

      // Se não tem nome, usar ID como fallback
      console.log("⚠️ Membro sem nome, usando ID como fallback")
      return `Agente-${member.Id}`
    }
  }

  // 2. Fallback: usar Setor se disponível
  if (chatData.Setor && typeof chatData.Setor === "string" && chatData.Setor.trim()) {
    console.log("✅ Usando Setor como nome do agente:", chatData.Setor)
    return chatData.Setor
  }

  // 3. Fallback: primeiro membro disponível em OrganizationMembers
  if (chatData.OrganizationMembers && chatData.OrganizationMembers.length > 0) {
    const firstMember = chatData.OrganizationMembers[0]
    if (firstMember.Name) {
      console.log("✅ Usando primeiro membro disponível:", firstMember.Name)
      return firstMember.Name
    }
    if (firstMember.DisplayName) {
      console.log("✅ Usando DisplayName do primeiro membro:", firstMember.DisplayName)
      return firstMember.DisplayName
    }
    console.log("⚠️ Usando ID do primeiro membro como fallback")
    return `Agente-${firstMember.Id}`
  }

  // 4. Fallback final: usar ID se disponível
  if (chatData.LastOrganizationMember?.Id) {
    console.log("⚠️ Usando LastOrganizationMember.Id como fallback final")
    return `Agente-${chatData.LastOrganizationMember.Id}`
  }

  console.log("❌ Nenhuma informação de agente encontrada, usando fallback genérico")
  return "Sistema"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔄 Webhook Umbler recebido:", JSON.stringify(body, null, 2))

    const { Type, EventDate, Payload, EventId } = body

    if (!Type || !Payload || !EventId) {
      return NextResponse.json(
        {
          error: "Formato inválido. Esperado: Type, EventDate, Payload, EventId",
        },
        { status: 400 },
      )
    }

    // Processar apenas eventos de mensagem por enquanto
    if (Type === "Message" && Payload.Type === "Chat") {
      const chatData = Payload.Content
      const lastMessage = chatData.LastMessage

      if (!chatData.Id || !lastMessage) {
        return NextResponse.json(
          {
            error: "Dados de chat ou mensagem ausentes",
          },
          { status: 400 },
        )
      }

      console.log("🔍 === DEBUG DADOS COMPLETOS ===")
      console.log("📝 lastMessage:", JSON.stringify(lastMessage, null, 2))
      console.log("👤 chatData.Contact:", JSON.stringify(chatData.Contact, null, 2))
      console.log("🎧 chatData.OrganizationMember:", JSON.stringify(chatData.OrganizationMember, null, 2))
      console.log("🎧 chatData.LastOrganizationMember:", JSON.stringify(chatData.LastOrganizationMember, null, 2))
      console.log("👥 chatData.OrganizationMembers:", JSON.stringify(chatData.OrganizationMembers, null, 2))

      const conversation_id = chatData.Id
      const customer_name = chatData.Contact?.Name || "Cliente"
      const customer_phone = chatData.Contact?.PhoneNumber || null
      const customer_email = chatData.Contact?.Email || null

      const sourceValue = (lastMessage.Source || "").toLowerCase().trim()
      console.log("📊 Source original:", lastMessage.Source)
      console.log("📊 Source processado:", sourceValue)

      let sender_type: "customer" | "agent"
      if (sourceValue === "contact" || sourceValue === "customer") {
        sender_type = "customer"
      } else if (sourceValue === "agent" || sourceValue === "member" || sourceValue === "organizationmember") {
        sender_type = "agent"
      } else {
        sender_type = chatData.LastOrganizationMember?.Id ? "agent" : "customer"
      }

      console.log("📊 sender_type determinado:", sender_type)

      const agent_name = extractAgentName(chatData, lastMessage)

      let sender_name: string
      if (sender_type === "agent") {
        // Para mensagens de agente: quem enviou é o atendente
        sender_name = agent_name
      } else {
        // Para mensagens de cliente: sender é o cliente
        sender_name = customer_name
      }

      console.log("✅ === RESULTADO FINAL MELHORADO ===")
      console.log(`📊 sender_type: "${sender_type}"`)
      console.log(`👤 sender_name: "${sender_name}"`)
      console.log(`🎧 agent_name: "${agent_name}"`)
      console.log("=====================================")

      const message_text = lastMessage.Content || "🎵 Mensagem de áudio ou arquivo"
      const isSiteCustomer = message_text.toLowerCase().includes("olá, vim do site do marcelino")

      console.log("🌐 === DETECÇÃO CLIENTE SITE ===")
      console.log("📝 Mensagem:", message_text.substring(0, 100))
      console.log("🔍 É cliente do site?", isSiteCustomer ? "✅ SIM" : "❌ NÃO")

      // Criar ou atualizar conversa
      await DatabaseService.createOrUpdateConversation({
        conversation_id,
        customer_name,
        customer_phone,
        customer_email,
        agent_name,
        is_site_customer: isSiteCustomer,
      })

      const message_id = lastMessage.Id || EventId
      const message_type = lastMessage.IsPrivate ? "private_note" : "message"
      const timestamp = new Date(EventDate)

      const savedMessage = await DatabaseService.createMessage({
        conversation_id,
        message_id,
        sender_type: sender_type as "customer" | "agent",
        sender_name,
        message_text,
        message_type,
        timestamp,
      })

      console.log("💾 Mensagem salva no banco:", savedMessage ? "✅ Sucesso" : "❌ Falhou")

      // Cálculo de tempo de resposta (mantido igual)
      if (sender_type === "agent" && !lastMessage.IsPrivate) {
        console.log("⏱️ === CALCULANDO TEMPO DE RESPOSTA ===")
        console.log(`📝 Mensagem do agente: ${sender_name}`)
        console.log(`📝 EventDate da resposta: ${EventDate}`)
        console.log(`📝 Conversa: ${conversation_id}`)

        const lastCustomerMessage = await DatabaseService.getLastCustomerMessage(conversation_id)

        if (lastCustomerMessage) {
          const customerMessageTime = new Date(lastCustomerMessage.timestamp)
          const agentResponseTime = new Date(EventDate)
          const responseTimeSeconds = Math.floor((agentResponseTime.getTime() - customerMessageTime.getTime()) / 1000)

          console.log(`📊 Última mensagem cliente: ${lastCustomerMessage.timestamp}`)
          console.log(`📊 Resposta do agente: ${EventDate}`)
          console.log(
            `⏱️ Tempo de resposta: ${responseTimeSeconds}s (${Math.floor(responseTimeSeconds / 60)}min ${responseTimeSeconds % 60}s)`,
          )

          if (responseTimeSeconds > 0) {
            await DatabaseService.saveResponseTime({
              conversation_id,
              customer_message_id: lastCustomerMessage.message_id,
              agent_message_id: message_id,
              response_time_seconds: responseTimeSeconds,
              customer_message_time: customerMessageTime,
              agent_response_time: agentResponseTime,
            })

            console.log(
              `✅ Tempo de resposta salvo: ${Math.floor(responseTimeSeconds / 60)}min ${responseTimeSeconds % 60}s`,
            )
          } else {
            console.log("⚠️ Tempo de resposta inválido (negativo ou zero)")
          }
        } else {
          console.log("ℹ️ Nenhuma mensagem de cliente encontrada para calcular tempo de resposta")
        }
        console.log("==========================================")
      }

      console.log(
        `🎉 Mensagem processada - Conversa: ${conversation_id}, Sender: ${sender_type}, Site Customer: ${isSiteCustomer}`,
      )

      return NextResponse.json({
        success: true,
        message: "Webhook processado com sucesso",
        event_type: Type,
        conversation_id,
        sender_type,
        sender_name,
        agent_name,
        is_site_customer: isSiteCustomer,
        event_id: EventId,
        processed_at: new Date().toISOString(),
      })
    }

    if (Type === "ChatClosed") {
      const conversation_id = Payload.Content.Id
      await DatabaseService.updateConversationStatus(conversation_id, "closed")
      console.log(`✅ Chat fechado - Conversa: ${conversation_id}`)
      return NextResponse.json({
        success: true,
        message: "Chat fechado processado",
        event_type: Type,
        conversation_id,
        event_id: EventId,
      })
    }

    if (Type === "MemberTransfer") {
      const conversation_id = Payload.Content.Id
      const new_agent = extractAgentName(Payload.Content, null)
      await DatabaseService.updateConversationAgent(conversation_id, new_agent)
      console.log(`✅ Transferência processada - Conversa: ${conversation_id}, Novo agente: ${new_agent}`)
      return NextResponse.json({
        success: true,
        message: "Transferência processada",
        event_type: Type,
        conversation_id,
        new_agent,
        event_id: EventId,
      })
    }

    console.log(`ℹ️ Evento recebido mas não processado: ${Type}`)
    return NextResponse.json({
      success: true,
      message: `Evento ${Type} recebido mas não processado`,
      event_type: Type,
      event_id: EventId,
    })
  } catch (error) {
    console.error("❌ Erro ao processar webhook Umbler:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Webhook endpoint da Umbler está funcionando",
    timestamp: new Date().toISOString(),
    expected_format: {
      Type: "Message | ChatClosed | MemberTransfer | ChatSectorChanged | ChatPrivateStatusChanged",
      EventDate: "2024-02-07T18:44:01.3135533Z",
      Payload: {
        Type: "Chat",
        Content: "BasicChatModel object",
      },
      EventId: "ZcPPcWpimiD3EiER",
    },
  })
}
