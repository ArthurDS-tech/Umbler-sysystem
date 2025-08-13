import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET() {
  try {
    // Buscar as últimas 5 mensagens para análise
    const recentMessages = await DatabaseService.getRecentMessages(5)

    return NextResponse.json({
      success: true,
      message: "Debug dos dados do webhook",
      recent_messages: recentMessages,
      instructions: {
        step1: "Envie uma mensagem de teste da Umbler",
        step2: "Verifique os logs do console no servidor",
        step3: "Os logs mostrarão TODOS os campos disponíveis",
        step4: "Procure por campos que contenham o nome do atendente",
      },
      webhook_logs_to_check: [
        "🔍 === DEBUG DADOS COMPLETOS ===",
        "📝 lastMessage:",
        "🎧 chatData.OrganizationMember:",
        "🎧 === TODAS AS FONTES DE NOME DO AGENTE ===",
        "✅ Nome do agente selecionado:",
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao buscar dados de debug",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
