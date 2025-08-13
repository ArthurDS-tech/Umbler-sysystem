import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔄 Webhook Umbler recebido:", JSON.stringify(body, null, 2))

    const { Type, EventDate, Payload, EventId } = body

    if (!Type || !Payload || !EventId) {
      console.log("❌ Formato inválido")
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
        console.log("❌ Dados de chat ou mensagem ausentes")
        return NextResponse.json({ error: "Dados de chat ou mensagem ausentes" }, { status: 400 })
      }

      const conversation_id = chatData.Id
      const customer_name = chatData.Contact?.Name || "Cliente"
      const customer_phone = chatData.Contact?.PhoneNumber || chatData.Contact?.Phone || null
      const customer_email = chatData.Contact?.Email || null

      const sourceValue = (lastMessage.Source || "").toLowerCase().trim()
      let sender_type: "customer" | "agent"
      if (sourceValue === "contact" || sourceValue === "customer") {
        sender_type = "customer"
      } else {
        sender_type = "agent"
      }

      let agent_name = "Atendente"
      let agent_id: string | null = null

      if (chatData.Setor && typeof chatData.Setor === "string" && chatData.Setor.trim()) {
        agent_name = chatData.Setor.trim()
      } else if (chatData.LastOrganizationMember?.Id) {
        agent_id = chatData.LastOrganizationMember.Id
        agent_name = `Agente-${agent_id}`
      }

      const sender_name = sender_type === "agent" ? agent_name : customer_name
      const message_text = lastMessage.Content || "🎵 Mensagem de áudio ou arquivo"
      const isSiteCustomer = message_text.toLowerCase().includes("olá, vim do site do marcelino")

      console.log(`📝 Processando: ${conversation_id} - ${sender_type}: ${sender_name}`)

      try {
        await DatabaseService.createOrUpdateConversation({
          conversation_id,
          customer_name,
          customer_phone,
          customer_email,
          agent_name,
          agent_id,
          is_site_customer: isSiteCustomer,
        })

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

        console.log(`✅ Mensagem salva: ${conversation_id}`)

        return NextResponse.json({
          success: true,
          message: "Webhook processado com sucesso",
          event_type: Type,
          conversation_id,
          sender_type,
          agent_name,
          event_id: EventId,
        })
      } catch (dbError) {
        console.error("❌ Erro no banco de dados:", dbError)
        return NextResponse.json({ error: "Erro ao salvar no banco de dados" }, { status: 500 })
      }
    }

    if (Type === "ChatClosed") {
      const conversation_id = Payload.Content.Id
      try {
        await DatabaseService.updateConversationStatus(conversation_id, "closed")
        console.log(`✅ Chat fechado: ${conversation_id}`)
        return NextResponse.json({
          success: true,
          message: "Chat fechado processado",
          event_type: Type,
          conversation_id,
          event_id: EventId,
        })
      } catch (dbError) {
        console.error("❌ Erro ao fechar chat:", dbError)
        return NextResponse.json({ error: "Erro ao fechar chat" }, { status: 500 })
      }
    }

    console.log(`ℹ️ Evento não processado: ${Type}`)
    return NextResponse.json({
      success: true,
      message: `Evento ${Type} recebido mas não processado`,
      event_type: Type,
      event_id: EventId,
    })
  } catch (error) {
    console.error("❌ Erro geral no webhook:", error)
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
    status: "active",
  })
}
