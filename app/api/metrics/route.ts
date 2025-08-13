import { NextResponse } from "next/server"
import { MetricsService } from "@/lib/metrics"

export async function GET() {
  try {
    const metrics = await MetricsService.getSystemMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Erro ao buscar métricas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
