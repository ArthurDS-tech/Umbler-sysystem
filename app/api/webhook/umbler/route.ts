import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

interface UmblerContact {
  Name?: string
  PhoneNumber?: string
  Phone?: string
  Email?: string
}

interface UmblerMessage {
  Id?: string
  Content?: string
  Source?: string
  IsPrivate?: boolean
  Sender?: {
    Id?: string
    Name?: string
    DisplayName?: string
  }
}

interface UmblerChatData {
  Id: string
  Contact?: UmblerContact
  LastMessage: UmblerMessage
  LastOrganizationMember?: { Id: string }
  OrganizationMembers?: Array<{ Id: string; Name?: string; DisplayName?: string }>
  OrganizationMember?: { Id: string }
  Setor?: string
  Tags?: string[]
}

function extractAgentInfo(chatData: UmblerChatData, lastMessage: UmblerMessage): { name: string; id: string | null } {
  console.log("🔍 === EXTRACTING AGENT INFO (NAME + ID) ===")

  try {
    // 1. Try to get agent from LastOrganizationMember.Id in OrganizationMembers array
    if (
      chatData.LastOrganizationMember?.Id &&
      Array.isArray(chatData.OrganizationMembers) &&
      chatData.OrganizationMembers.length > 0
    ) {
      const memberId = chatData.LastOrganizationMember.Id
      const member = chatData.OrganizationMembers.find((m) => m.Id === memberId)
      if (member) {
        const agentName = member.Name || member.DisplayName
        if (agentName && agentName.trim()) {
          console.log(`✅ Agent found by LastOrganizationMember.Id: ${agentName} (ID: ${memberId})`)
          return { name: agentName.trim(), id: memberId }
        }
      }
      // Even if no name found, we have the ID
      console.log(`⚠️ Agent ID found but no name: ${memberId}`)
      return { name: `Agente-${memberId}`, id: memberId }
    }

    // 2. Try to get agent from message sender (for agent messages)
    const sourceValue = (lastMessage.Source || "").toLowerCase()
    if (sourceValue === "agent" || sourceValue === "member") {
      if (lastMessage.Sender?.Name) {
        const senderId = lastMessage.Sender?.Id || null
        console.log(`✅ Agent found from message sender: ${lastMessage.Sender.Name} (ID: ${senderId})`)
        return { name: lastMessage.Sender.Name.trim(), id: senderId }
      }
      if (lastMessage.Sender?.DisplayName) {
        const senderId = lastMessage.Sender?.Id || null
        console.log(
          `✅ Agent found from message sender DisplayName: ${lastMessage.Sender.DisplayName} (ID: ${senderId})`,
        )
        return { name: lastMessage.Sender.DisplayName.trim(), id: senderId }
      }
    }

    // 3. Try OrganizationMember.Id (single member)
    if (chatData.OrganizationMember?.Id) {
      const memberId = chatData.OrganizationMember.Id
      // Try to find name in OrganizationMembers array
      if (Array.isArray(chatData.OrganizationMembers) && chatData.OrganizationMembers.length > 0) {
        const member = chatData.OrganizationMembers.find((m) => m.Id === memberId)
        if (member && (member.Name || member.DisplayName)) {
          const agentName = member.Name || member.DisplayName
          console.log(`✅ Agent found by OrganizationMember.Id: ${agentName} (ID: ${memberId})`)
          return { name: agentName.trim(), id: memberId }
        }
      }
      console.log(`⚠️ Using OrganizationMember ID as fallback: ${memberId}`)
      return { name: `Agente-${memberId}`, id: memberId }
    }

    // 4. Try Setor field (department/sector) - no ID available
    if (chatData.Setor && typeof chatData.Setor === "string" && chatData.Setor.trim()) {
      console.log(`✅ Agent found from Setor: ${chatData.Setor} (no ID available)`)
      return { name: chatData.Setor.trim(), id: null }
    }

    // 5. Try first available member in OrganizationMembers
    if (Array.isArray(chatData.OrganizationMembers) && chatData.OrganizationMembers.length > 0) {
      const firstMember = chatData.OrganizationMembers[0]
      const agentName = firstMember.Name || firstMember.DisplayName
      const agentId = firstMember.Id
      if (agentName && agentName.trim()) {
        console.log(`✅ Agent found from first OrganizationMember: ${agentName} (ID: ${agentId})`)
        return { name: agentName.trim(), id: agentId || null }
      }
    }

    // 6. Final fallback
    console.log("❌ No agent information found, using default")
    return { name: "Atendente", id: null }
  } catch (error) {
    console.error("❌ Error extracting agent info:", error)
    return { name: "Atendente", id: null }
  }
}

function detectAndProcessTags(messageText: string, conversationId: string, chatData: UmblerChatData): string[] {
  const detectedTags: string[] = []

  try {
    // Detect tag addition messages from Umbler system
    const tagAddedPattern = /etiqueta adicionada na conversa[:\s]*([^.\n]+)/i
    const tagAddedMatch = messageText.match(tagAddedPattern)

    if (tagAddedMatch) {
      const tagName = tagAddedMatch[1].trim()
      console.log(`🏷️ Tag detectada: "${tagName}" na conversa ${conversationId}`)
      detectedTags.push(tagName)
    }

    // Detect tag removal messages from Umbler system
    const tagRemovedPattern = /etiqueta removida da conversa[:\s]*([^.\n]+)/i
    const tagRemovedMatch = messageText.match(tagRemovedPattern)

    if (tagRemovedMatch) {
      const tagName = tagRemovedMatch[1].trim()
      console.log(`🏷️ Tag removida: "${tagName}" da conversa ${conversationId}`)
      detectedTags.push(`REMOVE:${tagName}`)
    }

    // Also check for tags in the chatData.Tags field if available
    if (Array.isArray(chatData.Tags)) {
      chatData.Tags.forEach((tag: string) => {
        if (tag && tag.trim()) {
          console.log(`🏷️ Tag do chatData: "${tag}" na conversa ${conversationId}`)
          detectedTags.push(tag.trim())
        }
      })
    }
  } catch (error) {
    console.error("❌ Error detecting tags:", error)
  }

  return detectedTags
}

async function processTags(conversationId: string, tags: string[]) {
  for (const tag of tags) {
    try {
      if (tag.startsWith("REMOVE:")) {
        const tagToRemove = tag.replace("REMOVE:", "")
        await DatabaseService.removeTagFromConversation(conversationId, tagToRemove)
        console.log(`✅ Tag removida: "${tagToRemove}" da conversa ${conversationId}`)
      } else {
        await DatabaseService.addTagToConversation(conversationId, tag)
        console.log(`✅ Tag adicionada: "${tag}" à conversa ${conversationId}`)
      }
    } catch (error) {
      console.error(`❌ Erro ao processar tag "${tag}":`, error)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set")
      return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
    }

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
      const chatData: UmblerChatData = Payload.Content
      const lastMessage: UmblerMessage = chatData.LastMessage

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
      console.log("🏷️ chatData.Tags:", JSON.stringify(chatData.Tags, null, 2))

      const conversation_id = chatData.Id
      const customer_name = chatData.Contact?.Name || "Cliente"
      const customer_phone = chatData.Contact?.PhoneNumber || chatData.Contact?.Phone || null
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
        sender_type = sourceValue.includes("member") || sourceValue.includes("agent") ? "agent" : "customer"
      }

      console.log("📊 sender_type determinado:", sender_type)

      const agentInfo = extractAgentInfo(chatData, lastMessage)
      const agent_name = agentInfo.name
      const agent_id = agentInfo.id

      let sender_name: string
      if (sender_type === "agent") {
        // For agent messages: sender is the agent who sent the message
        sender_name = agent_name
      } else {
        // For customer messages: sender is the customer
        sender_name = customer_name
      }

      console.log("✅ === RESULTADO FINAL COM ID ===")
      console.log(`📊 sender_type: "${sender_type}"`)
      console.log(`👤 sender_name: "${sender_name}"`)
      console.log(`🎧 agent_name: "${agent_name}"`)
      console.log(`🆔 agent_id: "${agent_id || "N/A"}"`)
      console.log("=====================================")

      const message_text = lastMessage.Content || "🎵 Mensagem de áudio ou arquivo"
      const isSiteCustomer = message_text.toLowerCase().includes("olá, vim do site do marcelino")

      console.log("🌐 === DETECÇÃO CLIENTE SITE ===")
      console.log("📝 Mensagem:", message_text.substring(0, 100))
      console.log("🔍 É cliente do site?", isSiteCustomer ? "✅ SIM" : "❌ NÃO")

      console.log("🏷️ === PROCESSAMENTO DE ETIQUETAS ===")
      const detectedTags = detectAndProcessTags(message_text, conversation_id, chatData)
      console.log(`🏷️ Tags detectadas: ${detectedTags.length > 0 ? detectedTags.join(", ") : "Nenhuma"}`)

      await DatabaseService.createOrUpdateConversation({
        conversation_id,
        customer_name,
        customer_phone,
        customer_email,
        agent_name,
        agent_id,
        is_site_customer: isSiteCustomer,
      })

      if (detectedTags.length > 0) {
        await processTags(conversation_id, detectedTags)
      }

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

      if (sender_type === "agent" && !lastMessage.IsPrivate) {
        console.log("⏱️ === CALCULANDO TEMPO DE RESPOSTA ===")

        const lastCustomerMessage = await DatabaseService.getLastCustomerMessage(conversation_id)

        if (lastCustomerMessage) {
          const customerMessageTime = new Date(lastCustomerMessage.timestamp)
          const agentResponseTime = new Date(EventDate)
          const responseTimeSeconds = Math.floor((agentResponseTime.getTime() - customerMessageTime.getTime()) / 1000)

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
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Webhook processado com sucesso",
        event_type: Type,
        conversation_id,
        sender_type,
        sender_name,
        agent_name,
        agent_id,
        is_site_customer: isSiteCustomer,
        detected_tags: detectedTags,
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
      const agentInfo = extractAgentInfo(Payload.Content, {})
      const new_agent = agentInfo.name
      const new_agent_id = agentInfo.id

      await DatabaseService.updateConversationAgent(conversation_id, new_agent, new_agent_id)
      console.log(
        `✅ Transferência processada - Conversa: ${conversation_id}, Novo agente: ${new_agent} (ID: ${new_agent_id || "N/A"})`,
      )
      return NextResponse.json({
        success: true,
        message: "Transferência processada",
        event_type: Type,
        conversation_id,
        new_agent,
        new_agent_id,
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
