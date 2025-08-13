import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

function parseChannelAttendant(fullName: string): { channel: string | null; attendantName: string; fullName: string } {
  const channelPattern = /^([^-]+)\s*-\s*(.+)$/
  const match = fullName.match(channelPattern)

  if (match) {
    const channel = match[1].trim()
    const attendantName = match[2].trim()
    return {
      channel,
      attendantName,
      fullName: fullName.trim(),
    }
  }

  return {
    channel: null,
    attendantName: fullName.trim(),
    fullName: fullName.trim(),
  }
}

function extractAgentInfo(
  chatData: any,
  lastMessage: any,
): { name: string; id: string | null; channel: string | null; attendantName: string } {
  // 1. Try LastOrganizationMember.Id in OrganizationMembers array
  if (chatData.LastOrganizationMember?.Id && chatData.OrganizationMembers?.length > 0) {
    const memberId = chatData.LastOrganizationMember.Id
    const member = chatData.OrganizationMembers.find((m: any) => m.Id === memberId)
    if (member) {
      const agentName = member.Name || member.DisplayName
      if (agentName && agentName.trim()) {
        const parsed = parseChannelAttendant(agentName)
        return {
          name: parsed.fullName,
          id: memberId,
          channel: parsed.channel,
          attendantName: parsed.attendantName,
        }
      }
    }
    return { name: `Agente-${memberId}`, id: memberId, channel: null, attendantName: `Agente-${memberId}` }
  }

  // 2. Try message sender for agent messages
  if (lastMessage.Source?.toLowerCase() === "agent" || lastMessage.Source?.toLowerCase() === "member") {
    if (lastMessage.Sender?.Name) {
      const senderId = lastMessage.Sender?.Id || null
      const parsed = parseChannelAttendant(lastMessage.Sender.Name)
      return {
        name: parsed.fullName,
        id: senderId,
        channel: parsed.channel,
        attendantName: parsed.attendantName,
      }
    }
    if (lastMessage.Sender?.DisplayName) {
      const senderId = lastMessage.Sender?.Id || null
      const parsed = parseChannelAttendant(lastMessage.Sender.DisplayName)
      return {
        name: parsed.fullName,
        id: senderId,
        channel: parsed.channel,
        attendantName: parsed.attendantName,
      }
    }
  }

  // 3. Try OrganizationMember.Id
  if (chatData.OrganizationMember?.Id) {
    const memberId = chatData.OrganizationMember.Id
    if (chatData.OrganizationMembers?.length > 0) {
      const member = chatData.OrganizationMembers.find((m: any) => m.Id === memberId)
      if (member && (member.Name || member.DisplayName)) {
        const agentName = member.Name || member.DisplayName
        const parsed = parseChannelAttendant(agentName)
        return {
          name: parsed.fullName,
          id: memberId,
          channel: parsed.channel,
          attendantName: parsed.attendantName,
        }
      }
    }
    return { name: `Agente-${memberId}`, id: memberId, channel: null, attendantName: `Agente-${memberId}` }
  }

  // 4. Try Setor field
  if (chatData.Setor && typeof chatData.Setor === "string" && chatData.Setor.trim()) {
    const parsed = parseChannelAttendant(chatData.Setor)
    return {
      name: parsed.fullName,
      id: null,
      channel: parsed.channel,
      attendantName: parsed.attendantName,
    }
  }

  // 5. Try first available member
  if (chatData.OrganizationMembers?.length > 0) {
    const firstMember = chatData.OrganizationMembers[0]
    const agentName = firstMember.Name || firstMember.DisplayName
    const agentId = firstMember.Id
    if (agentName && agentName.trim()) {
      const parsed = parseChannelAttendant(agentName)
      return {
        name: parsed.fullName,
        id: agentId || null,
        channel: parsed.channel,
        attendantName: parsed.attendantName,
      }
    }
  }

  return { name: "Atendente", id: null, channel: null, attendantName: "Atendente" }
}

function detectAndProcessTags(messageText: string, chatData: any): string[] {
  const detectedTags: string[] = []

  // Detect tag messages from Umbler
  const tagAddedPattern = /etiqueta adicionada na conversa[:\s]*([^.\n]+)/i
  const tagAddedMatch = messageText.match(tagAddedPattern)
  if (tagAddedMatch) {
    detectedTags.push(tagAddedMatch[1].trim())
  }

  const tagRemovedPattern = /etiqueta removida da conversa[:\s]*([^.\n]+)/i
  const tagRemovedMatch = messageText.match(tagRemovedPattern)
  if (tagRemovedMatch) {
    detectedTags.push(`REMOVE:${tagRemovedMatch[1].trim()}`)
  }

  // Check chatData.Tags
  if (chatData.Tags && Array.isArray(chatData.Tags)) {
    chatData.Tags.forEach((tag: string) => {
      if (tag && tag.trim()) {
        detectedTags.push(tag.trim())
      }
    })
  }

  return detectedTags
}

async function processTags(conversationId: string, tags: string[]) {
  for (const tag of tags) {
    try {
      if (tag.startsWith("REMOVE:")) {
        const tagToRemove = tag.replace("REMOVE:", "")
        await DatabaseService.removeTagFromConversation(conversationId, tagToRemove)
      } else {
        await DatabaseService.addTagToConversation(conversationId, tag)
      }
    } catch (error) {
      console.error(`Erro ao processar tag "${tag}":`, error)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔄 Webhook Umbler recebido")

    const { Type, EventDate, Payload, EventId } = body

    if (!Type || !Payload || !EventId) {
      return NextResponse.json(
        { error: "Formato inválido. Esperado: Type, EventDate, Payload, EventId" },
        { status: 400 },
      )
    }

    // Process Message events
    if (Type === "Message" && Payload.Type === "Chat") {
      const chatData = Payload.Content
      const lastMessage = chatData.LastMessage

      if (!chatData.Id || !lastMessage) {
        return NextResponse.json({ error: "Dados de chat ou mensagem ausentes" }, { status: 400 })
      }

      const conversation_id = chatData.Id
      const customer_name = chatData.Contact?.Name || "Cliente"
      const customer_phone = chatData.Contact?.PhoneNumber || chatData.Contact?.Phone || null
      const customer_email = chatData.Contact?.Email || null

      // Determine sender type
      const sourceValue = (lastMessage.Source || "").toLowerCase().trim()
      let sender_type: "customer" | "agent"
      if (sourceValue === "contact" || sourceValue === "customer") {
        sender_type = "customer"
      } else if (sourceValue === "agent" || sourceValue === "member" || sourceValue === "organizationmember") {
        sender_type = "agent"
      } else {
        sender_type = sourceValue.includes("member") || sourceValue.includes("agent") ? "agent" : "customer"
      }

      // Extract agent information
      const agentInfo = extractAgentInfo(chatData, lastMessage)
      const agent_name = agentInfo.name
      const agent_id = agentInfo.id

      // Determine sender name
      const sender_name = sender_type === "agent" ? agent_name : customer_name

      const message_text = lastMessage.Content || "🎵 Mensagem de áudio ou arquivo"
      const isSiteCustomer = message_text.toLowerCase().includes("olá, vim do site do marcelino")

      // Process tags
      const detectedTags = detectAndProcessTags(message_text, chatData)

      // Save conversation
      await DatabaseService.createOrUpdateConversation({
        conversation_id,
        customer_name,
        customer_phone,
        customer_email,
        agent_name,
        agent_id,
        is_site_customer: isSiteCustomer,
      })

      // Process tags if any
      if (detectedTags.length > 0) {
        await processTags(conversation_id, detectedTags)
      }

      // Save message
      const message_id = lastMessage.Id || EventId
      const message_type = lastMessage.IsPrivate ? "private_note" : "message"
      const timestamp = new Date(EventDate)

      await DatabaseService.createMessage({
        conversation_id,
        message_id,
        sender_type: sender_type as "customer" | "agent",
        sender_name,
        message_text,
        message_type,
        timestamp,
      })

      // Calculate response time for agent messages
      if (sender_type === "agent" && !lastMessage.IsPrivate) {
        try {
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
            }
          }
        } catch (error) {
          console.error("Erro ao calcular tempo de resposta:", error)
        }
      }

      console.log(`✅ Mensagem processada - Conversa: ${conversation_id}, Sender: ${sender_type}, Agent: ${agent_name}`)

      return NextResponse.json({
        success: true,
        message: "Webhook processado com sucesso",
        event_type: Type,
        conversation_id,
        sender_type,
        agent_name,
        agent_id,
        is_site_customer: isSiteCustomer,
        detected_tags: detectedTags,
        event_id: EventId,
      })
    }

    // Process ChatClosed events
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

    // Process MemberTransfer events
    if (Type === "MemberTransfer") {
      const conversation_id = Payload.Content.Id
      const agentInfo = extractAgentInfo(Payload.Content, {})
      const new_agent = agentInfo.name
      const new_agent_id = agentInfo.id

      await DatabaseService.updateConversationAgent(conversation_id, new_agent, new_agent_id)
      console.log(`✅ Transferência processada - Conversa: ${conversation_id}, Novo agente: ${new_agent}`)
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
