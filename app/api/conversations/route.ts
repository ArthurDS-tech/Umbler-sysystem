import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET() {
  try {
    const conversations = await DatabaseService.getConversationsWithMetrics()
    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Erro ao buscar conversas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
