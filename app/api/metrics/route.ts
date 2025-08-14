import { NextResponse } from "next/server"
import { MetricsService } from "@/lib/metrics"

export async function GET() {
  try {
    const metrics = await MetricsService.getSystemMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Erro ao buscar métricas:", error)
    return NextResponse.json({
      total_conversations: 0,
      active_conversations: 0,
      total_messages: 0,
      total_response_times: 0,
      overall_avg_response_time: 0,
      agents: [],
      recent_activity: [],
    })
  }
}
