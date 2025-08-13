import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🧪 === TESTE DE SIMULAÇÃO DO WEBHOOK ===")
    console.log("📝 Dados recebidos:", JSON.stringify(body, null, 2))

    // Simular dados da Umbler
    const testData = {
      Type: "Message",
      EventDate: new Date().toISOString(),
      EventId: "test_" + Date.now(),
      Payload: {
        Type: "Chat",
        Content: {
          Id: "test_conversation_" + Date.now(),
          Contact: {
            Name: "Cliente Teste",
            Phone: "+5511999999999",
            Email: "teste@exemplo.com"
          },
          OrganizationMember: {
            Name: "Ester Ramos",
            DisplayName: "Ester Ramos"
          },
          LastMessage: {
            Id: "test_message_" + Date.now(),
            Content: "Olá, vim do site do marcelino",
            Source: "contact",
            IsPrivate: false,
            Member: null
          }
        }
      }
    }

    console.log("📤 === ENVIANDO DADOS DE TESTE PARA O WEBHOOK ===")
    console.log("📍 URL: /api/webhook/umbler")
    console.log("📝 Dados de teste:", JSON.stringify(testData, null, 2))

    // Chamar o webhook internamente
    const webhookResponse = await fetch(`${request.nextUrl.origin}/api/webhook/umbler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    const webhookResult = await webhookResponse.json()
    
    console.log("📥 === RESPOSTA DO WEBHOOK ===")
    console.log("📊 Status:", webhookResponse.status)
    console.log("📝 Resultado:", JSON.stringify(webhookResult, null, 2))

    // Verificar se os dados foram salvos
    const recentMessages = await DatabaseService.getRecentMessages(3)
    const recentConversations = await DatabaseService.getConversationsWithMetrics()

    console.log("💾 === DADOS SALVOS NO BANCO ===")
    console.log("📝 Mensagens recentes:", recentMessages.length)
    console.log("💬 Conversas recentes:", recentConversations.length)

    return NextResponse.json({
      success: true,
      message: "Teste de simulação concluído",
      test_data_sent: testData,
      webhook_response: webhookResult,
      webhook_status: webhookResponse.status,
      data_saved: {
        messages_count: recentMessages.length,
        conversations_count: recentConversations.length,
        recent_messages: recentMessages.slice(0, 2),
        recent_conversations: recentConversations.slice(0, 2)
      },
      debug_info: {
        timestamp: new Date().toISOString(),
        test_id: testData.EventId,
        webhook_url: `${request.nextUrl.origin}/api/webhook/umbler`
      }
    })

  } catch (error) {
    console.error("❌ Erro no teste de simulação:", error)
    return NextResponse.json(
      {
        error: "Erro no teste de simulação",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint de teste de simulação do webhook",
    usage: "POST com dados de teste para simular webhook da Umbler",
    example: {
      Type: "Message",
      EventDate: "2024-01-01T00:00:00.000Z",
      EventId: "test_123",
      Payload: {
        Type: "Chat",
        Content: {
          Id: "chat_123",
          Contact: { Name: "Cliente", Phone: "+5511999999999" },
          OrganizationMember: { Name: "Ester Ramos" },
          LastMessage: {
            Id: "msg_123",
            Content: "Olá, vim do site do marcelino",
            Source: "contact",
            IsPrivate: false
          }
        }
      }
    }
  })
}