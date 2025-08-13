export async function GET() {
  try {
    // Verificar se há dados nas tabelas
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const conversations = await sql`SELECT COUNT(*) as count FROM conversations`
    const messages = await sql`SELECT COUNT(*) as count FROM messages`
    const responseTimes = await sql`SELECT COUNT(*) as count FROM response_times`

    // Buscar algumas conversas com detalhes
    const conversationsWithDetails = await sql`
      SELECT 
        c.conversation_id,
        c.customer_name,
        c.agent_name,
        COUNT(m.id) as total_messages,
        COUNT(CASE WHEN m.sender_type = 'customer' THEN 1 END) as customer_messages,
        COUNT(CASE WHEN m.sender_type = 'agent' THEN 1 END) as agent_messages,
        COUNT(rt.id) as response_times_count,
        AVG(rt.response_time_seconds) as avg_response_time
      FROM conversations c
      LEFT JOIN messages m ON c.conversation_id = m.conversation_id
      LEFT JOIN response_times rt ON c.conversation_id = rt.conversation_id
      GROUP BY c.id, c.conversation_id, c.customer_name, c.agent_name
      ORDER BY c.updated_at DESC
      LIMIT 5
    `

    // Buscar mensagens recentes
    const recentMessages = await sql`
      SELECT 
        conversation_id,
        sender_type,
        sender_name,
        message_text,
        timestamp
      FROM messages 
      ORDER BY timestamp DESC 
      LIMIT 10
    `

    return Response.json({
      success: true,
      counts: {
        conversations: conversations[0].count,
        messages: messages[0].count,
        response_times: responseTimes[0].count,
      },
      conversations_with_details: conversationsWithDetails,
      recent_messages: recentMessages,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro no debug:", error)
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
