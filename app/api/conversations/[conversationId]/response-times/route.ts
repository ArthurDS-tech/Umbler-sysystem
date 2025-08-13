import { DatabaseService } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { conversationId: string } }) {
  try {
    const responseTimes = await DatabaseService.getConversationResponseTimes(params.conversationId)
    return Response.json(responseTimes)
  } catch (error) {
    console.error("Erro ao buscar tempos de resposta:", error)
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
