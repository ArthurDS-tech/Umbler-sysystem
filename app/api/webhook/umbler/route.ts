import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

function parseChannelAttendant(fullName: string): { channel: string | null; attendantName: string; fullName: string } {
  // Check if the name follows the pattern "Channel - Attendant Name"
  const channelPattern = /^([^-]+)\s*-\s*(.+)$/
  const match = fullName.match(channelPattern)

  if (match) {
    const channel = match[1].trim()
    const attendantName = match[2].trim()
    console.log(`🏢 Canal detectado: "${channel}", Atendente: "${attendantName}"`)
    return {
      channel,
      attendantName,
      fullName: fullName.trim(),
    }
  }

  // If no pattern match, treat as single name
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
  console.log("🔍 === EXTRACTING AGENT INFO (NAME + ID + CHANNEL) ===")
  console.log("📊 LastOrganizationMember:", JSON.stringify(chatData.LastOrganizationMember, null, 2))
  console.log("📊 OrganizationMembers:", JSON.stringify(chatData.OrganizationMembers, null, 2))
  console.log("📊 OrganizationMember:", JSON.stringify(chatData.OrganizationMember, null, 2))
  console.log("📊 Setor:", chatData.Setor)

  // 1. Try to get agent from LastOrganizationMember.Id in OrganizationMembers array
  if (chatData.LastOrganizationMember?.Id && chatData.OrganizationMembers?.length > 0) {
    const memberId = chatData.LastOrganizationMember.Id
    const member = chatData.OrganizationMembers.find((m: any) => m.Id === memberId)
    if (member) {
      const agentName = member.Name || member.DisplayName
      if (agentName && agentName.trim()) {
        const parsed = parseChannelAttendant(agentName)
        console.log(`✅ Agent found by LastOrganizationMember.Id: ${parsed.fullName} (ID: ${memberId})`)
        return {
          name: parsed.fullName,
          id: memberId,
          channel: parsed.channel,
          attendantName: parsed.attendantName,
        }
      }
    }
    // Even if no name found, we have the ID
    console.log(`⚠️ Agent ID found but no name: ${memberId}`)
    return { name: `Agente-${memberId}`, id: memberId, channel: null, attendantName: `Agente-${memberId}` }
  }

  // 2. Try to get agent from message sender (for agent messages)
  if (lastMessage.Source?.toLowerCase() === "agent" || lastMessage.Source?.toLowerCase() === "member") {
    if (lastMessage.Sender?.Name) {
      const senderId = lastMessage.Sender?.Id || null
      const parsed = parseChannelAttendant(lastMessage.Sender.Name)
      console.log(`✅ Agent found from message sender: ${parsed.fullName} (ID: ${senderId})`)
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
      console.log(`✅ Agent found from message sender DisplayName: ${parsed.fullName} (ID: ${senderId})`)
      return {
        name: parsed.fullName,
        id: senderId,
        channel: parsed.channel,
        attendantName: parsed.attendantName,
      }
    }
  }

  // 3. Try OrganizationMember.Id (single member)
  if (chatData.OrganizationMember?.Id) {
    const memberId = chatData.OrganizationMember.Id
    // Try to find name in OrganizationMembers array
    if (chatData.OrganizationMembers?.length > 0) {
      const member = chatData.OrganizationMembers.find((m: any) => m.Id === memberId)
      if (member && (member.Name || member.DisplayName)) {
        const agentName = member.Name || member.DisplayName
        const parsed = parseChannelAttendant(agentName)
        console.log(`✅ Agent found by OrganizationMember.Id: ${parsed.fullName} (ID: ${memberId})`)
        return {
          name: parsed.fullName,
          id: memberId,
          channel: parsed.channel,
          attendantName: parsed.attendantName,
        }
      }
    }
    console.log(`⚠️ Using OrganizationMember ID as fallback: ${memberId}`)
    return { name: `Agente-${memberId}`, id: memberId, channel: null, attendantName: `Agente-${memberId}` }
  }

  // 4. Try Setor field (department/sector) - no ID available
  if (chatData.Setor && typeof chatData.Setor === "string" && chatData.Setor.trim()) {
    const parsed = parseChannelAttendant(chatData.Setor)
    console.log(`✅ Agent found from Setor: ${parsed.fullName} (no ID available)`)
    return {
      name: parsed.fullName,
      id: null,
      channel: parsed.channel,
      attendantName: parsed.attendantName,
    }
  }

  // 5. Try first available member in OrganizationMembers
  if (chatData.OrganizationMembers?.length > 0) {
    const firstMember = chatData.OrganizationMembers[0]
    const agentName = firstMember.Name || firstMember.DisplayName
    const agentId = firstMember.Id
    if (agentName && agentName.trim()) {
      const parsed = parseChannelAttendant(agentName)
      console.log(`✅ Agent found from first OrganizationMember: ${parsed.fullName} (ID: ${agentId})`)
      return {
        name: parsed.fullName,
        id: agentId || null,
        channel: parsed.channel,
        attendantName: parsed.attendantName,
      }
    }
  }

  // 6. Final fallback
  console.log("❌ No agent information found, using default")
  return { name: "Atendente", id: null, channel: null, attendantName: "Atendente" }
}

function detectAndProcessTags(messageText: string, conversationId: string, chatData: any): string[] {
  const detectedTags: string[] = []

  // Fixed function to accept chatData parameter
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
  if (chatData.Tags && Array.isArray(chatData.Tags)) {
    chatData.Tags.forEach((tag: string) => {
      if (tag && tag.trim()) {
        console.log(`🏷️ Tag do chatData: "${tag}" na conversa ${conversationId}`)
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
      const agent_channel = agentInfo.channel
      const attendant_name = agentInfo.attendantName

      let sender_name: string
      if (sender_type === "agent") {
        // For agent messages: sender is the agent who sent the message
        sender_name = agent_name
      } else {
        // For customer messages: sender is the customer
        sender_name = customer_name
      }

      console.log("✅ === RESULTADO FINAL COM CANAL E ATENDENTE ===")
      console.log(`📊 sender_type: "${sender_type}"`)
      console.log(`👤 sender_name: "${sender_name}"`)
      console.log(`🎧 agent_name: "${agent_name}"`)
      console.log(`🆔 agent_id: "${agent_id || "N/A"}"`)
      console.log(`🏢 agent_channel: "${agent_channel || "N/A"}"`)
      console.log(`👨‍💼 attendant_name: "${attendant_name}"`)
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
        `🎉 Mensagem processada - Conversa: ${conversation_id}, Sender: ${sender_type}, Agent ID: ${agent_id || "N/A"}, Site Customer: ${isSiteCustomer}, Tags: ${detectedTags.length}`,
      )

      return NextResponse.json({
        success: true,
        message: "Webhook processado com sucesso",
        event_type: Type,
        conversation_id,
        sender_type,
        sender_name,
        agent_name,
        agent_id,
        agent_channel,
        attendant_name,
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
