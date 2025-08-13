import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { agentName: string } }) {
  try {
    const agentName = decodeURIComponent(params.agentName)
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const [agentStats] = await sql`
      SELECT 
        c.agent_name,
        COUNT(DISTINCT c.conversation_id) as total_conversations,
        COUNT(CASE WHEN m.sender_type = 'agent' THEN m.id END) as total_messages,
        AVG(rt.response_time_seconds) as avg_response_time,
        MIN(rt.response_time_seconds) as min_response_time,
        MAX(rt.response_time_seconds) as max_response_time,
        COUNT(rt.id) as response_count,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN c.status = 'closed' THEN 1 END) as closed_conversations
      FROM conversations c
      LEFT JOIN messages m ON c.conversation_id = m.conversation_id AND m.sender_type = 'agent'
      LEFT JOIN response_times rt ON c.conversation_id = rt.conversation_id
      WHERE c.agent_name = ${agentName}
      GROUP BY c.agent_name
    `

    if (!agentStats) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const pendingResponse = await fetch(
      `${request.url.replace(`/agents/${params.agentName}/performance`, "")}/conversations/pending?agent=${encodeURIComponent(agentName)}`,
    )
    const pendingConversations = await pendingResponse.json()

    const recentConversations = await sql`
      SELECT 
        c.*,
        COUNT(m.id) as total_messages,
        AVG(rt.response_time_seconds) as avg_response_time
      FROM conversations c
      LEFT JOIN messages m ON c.conversation_id = m.conversation_id
      LEFT JOIN response_times rt ON c.conversation_id = rt.conversation_id
      WHERE c.agent_name = ${agentName}
      GROUP BY c.id, c.conversation_id, c.customer_name, c.customer_phone, c.customer_email, c.agent_name, c.agent_id, c.status, c.is_site_customer, c.created_at, c.updated_at, c.tags
      ORDER BY c.updated_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      agent_stats: {
        agent_name: agentStats.agent_name,
        total_conversations: Number(agentStats.total_conversations) || 0,
        total_messages: Number(agentStats.total_messages) || 0,
        avg_response_time: Number(agentStats.avg_response_time) || 0,
        min_response_time: Number(agentStats.min_response_time) || 0,
        max_response_time: Number(agentStats.max_response_time) || 0,
        response_count: Number(agentStats.response_count) || 0,
        active_conversations: Number(agentStats.active_conversations) || 0,
        closed_conversations: Number(agentStats.closed_conversations) || 0,
      },
      pending_conversations: pendingConversations,
      recent_conversations: recentConversations,
    })
  } catch (error) {
    console.error("Erro ao buscar performance do agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
