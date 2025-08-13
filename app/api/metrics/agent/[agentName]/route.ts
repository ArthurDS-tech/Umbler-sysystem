import { type NextRequest, NextResponse } from "next/server"
import { MetricsService } from "@/lib/metrics"

export async function GET(request: NextRequest, { params }: { params: { agentName: string } }) {
  try {
    const agentName = decodeURIComponent(params.agentName)
    const metrics = await MetricsService.getAgentMetrics(agentName)

    if (!metrics) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Erro ao buscar métricas do agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
