import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔄 === WEBHOOK UMBLER RECEBIDO ===")
    console.log("📝 Dados completos:", JSON.stringify(body, null, 2))

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

      console.log("🔍 === ANÁLISE DETALHADA DOS DADOS ===")
      console.log("📝 lastMessage:", JSON.stringify(lastMessage, null, 2))
      console.log("👤 chatData.Contact:", JSON.stringify(chatData.Contact, null, 2))
      console.log("🎧 chatData.OrganizationMember:", JSON.stringify(chatData.OrganizationMember, null, 2))
      
      // Verificar se há outros campos que possam conter informações do agente
      console.log("🔍 chatData (todos os campos):", Object.keys(chatData))
      console.log("🔍 lastMessage (todos os campos):", Object.keys(lastMessage))
      
      // Verificar campos específicos que podem conter o nome do agente
      if (chatData.Member) console.log("👤 chatData.Member:", JSON.stringify(chatData.Member, null, 2))
      if (chatData.Agent) console.log("👤 chatData.Agent:", JSON.stringify(chatData.Agent, null, 2))
      if (chatData.AssignedTo) console.log("👤 chatData.AssignedTo:", JSON.stringify(chatData.AssignedTo, null, 2))
      if (lastMessage.Agent) console.log("👤 lastMessage.Agent:", JSON.stringify(lastMessage.Agent, null, 2))
      if (lastMessage.Sender) console.log("👤 lastMessage.Sender:", JSON.stringify(lastMessage.Sender, null, 2))

      const conversation_id = chatData.Id
      const customer_name = chatData.Contact?.Name || "Cliente"
      const customer_phone = chatData.Contact?.Phone || null
      const customer_email = chatData.Contact?.Email || null

      const sourceValue = (lastMessage.Source || "").toLowerCase().trim()
      console.log("📊 Source:", sourceValue)

      // Lógica simplificada para identificar o tipo de remetente
      const sender_type: "customer" | "agent" = 
        sourceValue === "contact" || sourceValue === "customer" ? "customer" : "agent"

      console.log("📊 sender_type:", sender_type)

      // Captura inteligente do nome do atendente - MÉTODO MELHORADO
      let agent_name = "Sistema"
      let sender_name: string

      if (sender_type === "agent") {
        // Para mensagens de agente: usar dados do membro que está enviando
        agent_name = 
          lastMessage.Member?.Name ||
          lastMessage.Member?.DisplayName ||
          lastMessage.Member?.FullName ||
          lastMessage.Member?.FirstName ||
          lastMessage.Member?.Username ||
          lastMessage.Member?.Email ||
          lastMessage.Agent?.Name ||
          lastMessage.Agent?.DisplayName ||
          lastMessage.Sender?.Name ||
          lastMessage.Sender?.DisplayName ||
          "Atendente"

        sender_name = agent_name
        
        console.log("🎧 === NOME DO ATENDENTE (ENVIANDO) ===")
        console.log("lastMessage.Member?.Name:", lastMessage.Member?.Name)
        console.log("lastMessage.Member?.DisplayName:", lastMessage.Member?.DisplayName)
        console.log("lastMessage.Agent?.Name:", lastMessage.Agent?.Name)
        console.log("lastMessage.Sender?.Name:", lastMessage.Sender?.Name)
        console.log("✅ Nome final:", agent_name)
      } else {
        // Para mensagens de cliente: usar agente responsável pela conversa
        agent_name = 
          chatData.OrganizationMember?.Name ||
          chatData.OrganizationMember?.DisplayName ||
          chatData.OrganizationMember?.FullName ||
          chatData.OrganizationMember?.FirstName ||
          chatData.OrganizationMember?.Username ||
          chatData.OrganizationMember?.Email ||
          chatData.Member?.Name ||
          chatData.Member?.DisplayName ||
          chatData.Agent?.Name ||
          chatData.Agent?.DisplayName ||
          chatData.AssignedTo?.Name ||
          chatData.AssignedTo?.DisplayName ||
          "Sistema"
        
        sender_name = customer_name
        
        console.log("👤 === AGENTE RESPONSÁVEL PELA CONVERSA ===")
        console.log("chatData.OrganizationMember?.Name:", chatData.OrganizationMember?.Name)
        console.log("chatData.OrganizationMember?.DisplayName:", chatData.OrganizationMember?.DisplayName)
        console.log("chatData.Member?.Name:", chatData.Member?.Name)
        console.log("chatData.Agent?.Name:", chatData.Agent?.Name)
        console.log("chatData.AssignedTo?.Name:", chatData.AssignedTo?.Name)
        console.log("✅ Nome final:", agent_name)
      }

      const message_text = lastMessage.Content || "🎵 Mensagem de áudio ou arquivo"
      const isSiteCustomer = message_text.toLowerCase().includes("olá, vim do site do marcelino")

      console.log("🌐 É cliente do site?", isSiteCustomer ? "✅ SIM" : "❌ NÃO")

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
        sender_type,
        sender_name,
        message_text,
        message_type,
        timestamp,
      })

      console.log("💾 Mensagem salva:", savedMessage ? "✅ Sucesso" : "❌ Falhou")

      // Calcular tempo de resposta apenas para mensagens de agente
      if (sender_type === "agent" && !lastMessage.IsPrivate) {
        console.log("⏱️ Calculando tempo de resposta...")

        const lastCustomerMessage = await DatabaseService.getLastCustomerMessage(conversation_id)

        if (lastCustomerMessage) {
          const customerMessageTime = new Date(lastCustomerMessage.timestamp)
          const agentResponseTime = new Date(EventDate)
          const responseTimeSeconds = Math.floor((agentResponseTime.getTime() - customerMessageTime.getTime()) / 1000)

          console.log(`⏱️ Tempo de resposta: ${responseTimeSeconds}s`)

          if (responseTimeSeconds > 0) {
            await DatabaseService.saveResponseTime({
              conversation_id,
              customer_message_id: lastCustomerMessage.message_id,
              agent_message_id: message_id,
              response_time_seconds: responseTimeSeconds,
              customer_message_time: customerMessageTime,
              agent_response_time: agentResponseTime,
            })

            console.log("✅ Tempo de resposta salvo")
          }
        }
      }

      console.log(`🎉 Mensagem processada - Conversa: ${conversation_id}`)

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

    // Processar outros tipos de evento
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
      const new_agent = Payload.Content.OrganizationMember?.Name || "Sistema"
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

    console.log(`ℹ️ Evento não processado: ${Type}`)
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
      Type: "Message | ChatClosed | MemberTransfer",
      EventDate: "2024-02-07T18:44:01.3135533Z",
      Payload: {
        Type: "Chat",
        Content: "BasicChatModel object",
      },
      EventId: "ZcPPcWpimiD3EiER",
    },
  })
}
