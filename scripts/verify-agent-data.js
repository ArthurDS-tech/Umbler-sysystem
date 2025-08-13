const { neon } = require("@neondatabase/serverless")

async function verifyAgentData() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("🔍 Verificando dados dos agentes...\n")

  try {
    // Verificar conversas por agente
    const conversations = await sql`
      SELECT 
        agent_name,
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_conversations,
        COUNT(CASE WHEN is_site_customer = true THEN 1 END) as site_customers
      FROM conversations 
      WHERE agent_name IS NOT NULL 
      GROUP BY agent_name 
      ORDER BY total_conversations DESC
    `

    console.log("📊 CONVERSAS POR AGENTE:")
    conversations.forEach((agent) => {
      console.log(
        `  ${agent.agent_name}: ${agent.total_conversations} conversas (${agent.active_conversations} ativas, ${agent.closed_conversations} fechadas, ${agent.site_customers} do site)`,
      )
    })

    // Verificar mensagens por agente
    const messages = await sql`
      SELECT 
        c.agent_name,
        COUNT(*) as total_messages,
        COUNT(CASE WHEN m.sender_type = 'customer' THEN 1 END) as customer_messages,
        COUNT(CASE WHEN m.sender_type = 'agent' THEN 1 END) as agent_messages
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.agent_name IS NOT NULL
      GROUP BY c.agent_name
      ORDER BY total_messages DESC
    `

    console.log("\n💬 MENSAGENS POR AGENTE:")
    messages.forEach((agent) => {
      console.log(
        `  ${agent.agent_name}: ${agent.total_messages} mensagens (${agent.customer_messages} recebidas, ${agent.agent_messages} enviadas)`,
      )
    })

    // Verificar tempos de resposta
    const responseTimes = await sql`
      SELECT 
        c.agent_name,
        COUNT(rt.*) as response_count,
        AVG(rt.response_time_seconds) as avg_response_time
      FROM response_times rt
      JOIN conversations c ON rt.conversation_id = c.id
      WHERE c.agent_name IS NOT NULL
      GROUP BY c.agent_name
      ORDER BY avg_response_time ASC
    `

    console.log("\n⏱️ TEMPOS DE RESPOSTA POR AGENTE:")
    responseTimes.forEach((agent) => {
      const avgMinutes = Math.round(agent.avg_response_time / 60)
      console.log(`  ${agent.agent_name}: ${agent.response_count} respostas, média ${avgMinutes} minutos`)
    })

    // Verificar conversas aguardando resposta
    const pending = await sql`
      SELECT 
        c.agent_name,
        c.customer_name,
        c.customer_phone,
        m.message_text,
        m.created_at as last_message_time,
        EXTRACT(EPOCH FROM (NOW() - m.created_at))/60 as wait_minutes
      FROM conversations c
      JOIN messages m ON c.id = m.conversation_id
      WHERE c.status = 'active' 
        AND c.agent_name IS NOT NULL
        AND m.sender_type = 'customer'
        AND m.created_at = (
          SELECT MAX(created_at) 
          FROM messages m2 
          WHERE m2.conversation_id = c.id
        )
      ORDER BY wait_minutes DESC
    `

    console.log("\n⏳ CONVERSAS AGUARDANDO RESPOSTA:")
    if (pending.length === 0) {
      console.log("  Nenhuma conversa aguardando resposta")
    } else {
      pending.forEach((conv) => {
        const waitTime = Math.round(conv.wait_minutes)
        const category = waitTime > 60 ? "🔴 URGENTE" : waitTime > 30 ? "🟡 ATENÇÃO" : "🟢 NORMAL"
        console.log(`  ${conv.agent_name} - ${conv.customer_name}: ${waitTime}min ${category}`)
      })
    }
  } catch (error) {
    console.error("❌ Erro ao verificar dados:", error)
  }
}

verifyAgentData()
