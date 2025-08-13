import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET() {
  try {
    const conversations = await DatabaseService.getConversationsWithMetrics()

    // Buscar mensagens detalhadas para debug
    const debugData = []

    for (const conv of conversations.slice(0, 3)) {
      // Apenas as 3 primeiras para não sobrecarregar
      const messages = await DatabaseService.getConversationMessages(conv.conversation_id)
      debugData.push({
        conversation_id: conv.conversation_id,
        customer_name: conv.customer_name,
        agent_name: conv.agent_name,
        messages: messages.map((m) => ({
          id: m.id,
          message_id: m.message_id,
          sender_type: m.sender_type,
          sender_name: m.sender_name,
          message_text: m.message_text?.substring(0, 100) + "...",
          timestamp: m.timestamp,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      debug_data: debugData,
      total_conversations: conversations.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro no debug:", error)
    return NextResponse.json({ error: "Erro ao buscar dados de debug" }, { status: 500 })
  }
}
