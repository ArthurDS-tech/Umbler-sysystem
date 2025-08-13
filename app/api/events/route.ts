import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  console.log("API de métricas chamada...")

  try {
    // Tentar importar e usar o DatabaseService
    const { DatabaseService } = await import("@/lib/database")
    const conversations = await DatabaseService.getConversationsWithMetrics()

    return Response.json({
      success: true,
      data: conversations.slice(0, 10),
      count: conversations.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro ao buscar métricas:", error)

    // Retornar dados mock em caso de erro
    const mockData = [
      {
        conversation_id: "demo_001",
        customer_name: "Cliente Demo",
        agent_name: "Agente Demo",
        total_messages: 5,
        avg_response_time: 120,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      {
        conversation_id: "demo_002",
        customer_name: "Cliente Teste",
        agent_name: "Agente Teste",
        total_messages: 8,
        avg_response_time: 95,
        status: "closed",
        updated_at: new Date().toISOString(),
      },
    ]

    return Response.json({
      success: true,
      data: mockData,
      count: mockData.length,
      timestamp: new Date().toISOString(),
      note: "Dados de demonstração - banco não disponível",
    })
  }
}
