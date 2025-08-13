import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const conversationId = params.conversationId

    const [messages, responseTimes] = await Promise.all([
      DatabaseService.getConversationMessages(conversationId),
      DatabaseService.getConversationResponseTimes(conversationId),
    ])

    return NextResponse.json({
      conversation_id: conversationId,
      messages,
      response_times: responseTimes,
    })
  } catch (error) {
    console.error("Erro ao buscar detalhes da conversa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
