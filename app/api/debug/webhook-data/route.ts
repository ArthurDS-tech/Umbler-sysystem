import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET() {
  try {
    // Buscar as últimas 10 mensagens para análise
    const recentMessages = await DatabaseService.getRecentMessages(10)
    
    // Buscar conversas recentes
    const recentConversations = await DatabaseService.getConversationsWithMetrics()
    
    // Buscar estatísticas dos clientes do site
    const siteCustomerStats = await DatabaseService.getSiteCustomersStats()

    return NextResponse.json({
      success: true,
      message: "Debug dos dados do webhook",
      timestamp: new Date().toISOString(),
      
      // Dados recentes para análise
      recent_messages: recentMessages,
      recent_conversations: recentConversations.slice(0, 5),
      site_customer_stats: siteCustomerStats,
      
      // Instruções para debug
      instructions: {
        step1: "Envie uma mensagem de teste da Umbler para este endpoint",
        step2: "Verifique os logs do console no servidor",
        step3: "Os logs mostrarão TODOS os campos disponíveis",
        step4: "Procure por campos que contenham o nome do atendente",
        step5: "Verifique se os nomes estão sendo salvos corretamente",
      },
      
      // Logs que devem aparecer no console
      webhook_logs_to_check: [
        "🔍 === DEBUG DADOS COMPLETOS ===",
        "📝 lastMessage:",
        "👤 chatData.Contact:",
        "🎧 chatData.OrganizationMember:",
        "📊 Source:",
        "📊 sender_type:",
        "🎧 Nome do atendente (enviando):",
        "👤 Agente responsável pela conversa:",
        "💾 Mensagem salva:",
      ],
      
      // Estrutura esperada dos dados
      expected_data_structure: {
        Type: "Message",
        EventDate: "ISO string",
        EventId: "string",
        Payload: {
          Type: "Chat",
          Content: {
            Id: "chat_id",
            Contact: {
              Name: "Nome do Cliente",
              Phone: "Telefone",
              Email: "Email"
            },
            OrganizationMember: {
              Name: "Nome do Agente",
              DisplayName: "Nome de Exibição"
            },
            LastMessage: {
              Id: "message_id",
              Content: "Conteúdo da mensagem",
              Source: "contact|member|agent",
              IsPrivate: false,
              Member: {
                Name: "Nome do Membro",
                DisplayName: "Nome de Exibição"
              }
            }
          }
        }
      },
      
      // Problemas comuns identificados
      common_issues: [
        "Campo is_site_customer não existe na tabela",
        "Dados do agente não estão sendo capturados corretamente",
        "Estrutura dos dados da Umbler diferente do esperado",
        "Problemas de permissão no banco de dados"
      ]
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
