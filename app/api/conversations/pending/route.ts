import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentName = searchParams.get("agent")
    const minWaitTime = Number.parseInt(searchParams.get("minWaitTime") || "0") // em minutos

    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    let query = `
      WITH last_messages AS (
        SELECT DISTINCT ON (conversation_id) 
          conversation_id,
          sender_type,
          timestamp,
          sender_name,
          message_text
        FROM messages 
        ORDER BY conversation_id, timestamp DESC
      ),
      pending_conversations AS (
        SELECT 
          c.*,
          lm.timestamp as last_message_time,
          lm.sender_name as last_sender,
          lm.message_text as last_message_text,
          EXTRACT(EPOCH FROM (NOW() - lm.timestamp))/60 as wait_time_minutes
        FROM conversations c
        JOIN last_messages lm ON c.conversation_id = lm.conversation_id
        WHERE lm.sender_type = 'customer' 
        AND c.status = 'active'
        AND EXTRACT(EPOCH FROM (NOW() - lm.timestamp))/60 >= $1
    `

    const params: any[] = [minWaitTime]

    if (agentName) {
      query += ` AND c.agent_name = $2`
      params.push(agentName)
    }

    query += ` ORDER BY wait_time_minutes DESC`

    const result = await sql(query, params)

    const pendingConversations = result.map((conv: any) => ({
      ...conv,
      wait_time_minutes: Math.round(conv.wait_time_minutes),
      wait_time_category:
        conv.wait_time_minutes <= 10 ? "normal" : conv.wait_time_minutes <= 30 ? "attention" : "urgent",
      wait_time_formatted:
        conv.wait_time_minutes < 60
          ? `${Math.round(conv.wait_time_minutes)}min`
          : `${Math.floor(conv.wait_time_minutes / 60)}h ${Math.round(conv.wait_time_minutes % 60)}min`,
    }))

    return NextResponse.json(pendingConversations)
  } catch (error) {
    console.error("Erro ao buscar conversas pendentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
