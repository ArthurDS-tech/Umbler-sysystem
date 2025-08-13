import { DatabaseService } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { conversationId: string } }) {
  try {
    console.log("🔍 Debug - Buscando mensagens para conversa:", params.conversationId)

    // Buscar mensagens diretamente do banco
    const messages = await DatabaseService.getConversationMessages(params.conversationId)

    console.log("📊 Mensagens encontradas:", messages.length)
    messages.forEach((msg, index) => {
      console.log(`📝 Mensagem ${index + 1}:`, {
        id: msg.id,
        sender_type: msg.sender_type,
        sender_name: msg.sender_name,
        message_text: msg.message_text?.substring(0, 50) + "...",
        timestamp: msg.timestamp,
      })
    })

    return Response.json({
      conversation_id: params.conversationId,
      total_messages: messages.length,
      messages: messages.map((msg) => ({
        id: msg.id,
        sender_type: msg.sender_type,
        sender_name: msg.sender_name,
        message_text: msg.message_text,
        timestamp: msg.timestamp,
        has_sender_name: !!msg.sender_name,
      })),
    })
  } catch (error) {
    console.error("❌ Erro ao buscar mensagens para debug:", error)
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
