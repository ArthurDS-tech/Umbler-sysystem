import { DatabaseService } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { conversationId: string } }) {
  try {
    const messages = await DatabaseService.getMessagesWithResponseTimes(params.conversationId)
    return Response.json(messages)
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
