import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET() {
  try {
    const stats = await DatabaseService.getSiteCustomersStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erro ao buscar estatísticas de clientes do site:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
