import { DatabaseService } from "./database"

export interface ConversationMetrics {
  conversation_id: string
  customer_name?: string
  agent_name?: string
  total_messages: number
  customer_messages: number
  agent_messages: number
  avg_response_time: number
  min_response_time: number
  max_response_time: number
  status: string
  created_at: Date
  updated_at: Date
}

export interface AgentMetrics {
  agent_name: string
  total_conversations: number
  total_messages: number
  avg_response_time: number
  min_response_time: number
  max_response_time: number
  response_count: number
}

export interface SystemMetrics {
  total_conversations: number
  active_conversations: number
  total_messages: number
  total_response_times: number
  overall_avg_response_time: number
  agents: AgentMetrics[]
  recent_activity: ConversationMetrics[]
}

export class MetricsService {
  static async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const { neon } = await import("@neondatabase/serverless")
      const sql = neon(process.env.DATABASE_URL!)

      let generalStats, agentStats, recentActivity

      try {
        // Estatísticas gerais
        ;[generalStats] = await sql`
          SELECT 
            COUNT(DISTINCT c.conversation_id) as total_conversations,
            COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.conversation_id END) as active_conversations,
            COUNT(m.id) as total_messages,
            COUNT(rt.id) as total_response_times,
            AVG(rt.response_time_seconds) as overall_avg_response_time
          FROM conversations c
          LEFT JOIN messages m ON c.conversation_id = m.conversation_id
          LEFT JOIN response_times rt ON c.conversation_id = rt.conversation_id
        `
      } catch (error) {
        console.error("Error fetching general stats:", error)
        generalStats = {
          total_conversations: 0,
          active_conversations: 0,
          total_messages: 0,
          total_response_times: 0,
          overall_avg_response_time: 0,
        }
      }

      try {
        // Métricas por agente
        agentStats = await sql`
          SELECT 
            c.agent_name,
            COUNT(DISTINCT c.conversation_id) as total_conversations,
            COUNT(CASE WHEN m.sender_type = 'agent' THEN m.id END) as total_messages,
            AVG(rt.response_time_seconds) as avg_response_time,
            MIN(rt.response_time_seconds) as min_response_time,
            MAX(rt.response_time_seconds) as max_response_time,
            COUNT(rt.id) as response_count
          FROM conversations c
          LEFT JOIN messages m ON c.conversation_id = m.conversation_id AND m.sender_type = 'agent'
          LEFT JOIN response_times rt ON c.conversation_id = rt.conversation_id
          WHERE c.agent_name IS NOT NULL
          GROUP BY c.agent_name
          ORDER BY avg_response_time ASC
        `
      } catch (error) {
        console.error("Error fetching agent stats:", error)
        agentStats = []
      }

      try {
        // Atividade recente
        recentActivity = await DatabaseService.getConversationsWithMetrics()
      } catch (error) {
        console.error("Error fetching recent activity:", error)
        recentActivity = []
      }

      return {
        total_conversations: Number(generalStats.total_conversations) || 0,
        active_conversations: Number(generalStats.active_conversations) || 0,
        total_messages: Number(generalStats.total_messages) || 0,
        total_response_times: Number(generalStats.total_response_times) || 0,
        overall_avg_response_time: Number(generalStats.overall_avg_response_time) || 0,
        agents: agentStats.map((agent) => ({
          agent_name: agent.agent_name || "Desconhecido",
          total_conversations: Number(agent.total_conversations) || 0,
          total_messages: Number(agent.total_messages) || 0,
          avg_response_time: Number(agent.avg_response_time) || 0,
          min_response_time: Number(agent.min_response_time) || 0,
          max_response_time: Number(agent.max_response_time) || 0,
          response_count: Number(agent.response_count) || 0,
        })),
        recent_activity: recentActivity.slice(0, 10).map((conv) => ({
          conversation_id: conv.conversation_id,
          customer_name: conv.customer_name,
          agent_name: conv.agent_name,
          total_messages: Number(conv.total_messages) || 0,
          customer_messages: Number(conv.customer_messages) || 0,
          agent_messages: Number(conv.agent_messages) || 0,
          avg_response_time: Number(conv.avg_response_time) || 0,
          min_response_time: Number(conv.min_response_time) || 0,
          max_response_time: Number(conv.max_response_time) || 0,
          status: conv.status,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        })),
      }
    } catch (error) {
      console.error("Error in getSystemMetrics:", error)
      return {
        total_conversations: 0,
        active_conversations: 0,
        total_messages: 0,
        total_response_times: 0,
        overall_avg_response_time: 0,
        agents: [],
        recent_activity: [],
      }
    }
  }

  static async getAgentMetrics(agentName: string): Promise<AgentMetrics | null> {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const [result] = await sql`
      SELECT 
        c.agent_name,
        COUNT(DISTINCT c.conversation_id) as total_conversations,
        COUNT(CASE WHEN m.sender_type = 'agent' THEN m.id END) as total_messages,
        AVG(rt.response_time_seconds) as avg_response_time,
        MIN(rt.response_time_seconds) as min_response_time,
        MAX(rt.response_time_seconds) as max_response_time,
        COUNT(rt.id) as response_count
      FROM conversations c
      LEFT JOIN messages m ON c.conversation_id = m.conversation_id AND m.sender_type = 'agent'
      LEFT JOIN response_times rt ON c.conversation_id = rt.conversation_id
      WHERE c.agent_name = ${agentName}
      GROUP BY c.agent_name
    `

    if (!result) return null

    return {
      agent_name: result.agent_name || "Desconhecido",
      total_conversations: Number(result.total_conversations) || 0,
      total_messages: Number(result.total_messages) || 0,
      avg_response_time: Number(result.avg_response_time) || 0,
      min_response_time: Number(result.min_response_time) || 0,
      max_response_time: Number(result.max_response_time) || 0,
      response_count: Number(result.response_count) || 0,
    }
  }

  static formatResponseTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  static getResponseTimeCategory(seconds: number): "excellent" | "good" | "average" | "slow" {
    if (seconds <= 30) return "excellent"
    if (seconds <= 120) return "good"
    if (seconds <= 300) return "average"
    return "slow"
  }
}
