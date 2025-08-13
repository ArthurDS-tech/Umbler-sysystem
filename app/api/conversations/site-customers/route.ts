import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET() {
  try {
    const conversations = await DatabaseService.getSiteCustomersWithMetrics()
    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Erro ao buscar clientes do site:", error)
    return NextResponse.json({ error: "Erro ao buscar clientes do site" }, { status: 500 })
  }
}
