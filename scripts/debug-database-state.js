// Script para debugar o estado atual do banco de dados
const { neon } = require("@neondatabase/serverless")

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function debugDatabase() {
  console.log("🔍 === DEBUG DO BANCO DE DADOS ===")

  try {
    // 1. Verificar estrutura das tabelas
    console.log("\n📋 1. ESTRUTURA DAS TABELAS:")

    const conversationsColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      ORDER BY ordinal_position
    `
    console.log("🗂️ Colunas da tabela 'conversations':")
    conversationsColumns.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "not null"})`)
    })

    // 2. Contar registros
    console.log("\n📊 2. CONTAGEM DE REGISTROS:")

    const [conversationsCount] = await sql`SELECT COUNT(*) as count FROM conversations`
    console.log(`💬 Conversas: ${conversationsCount.count}`)

    const [messagesCount] = await sql`SELECT COUNT(*) as count FROM messages`
    console.log(`📨 Mensagens: ${messagesCount.count}`)

    const [responseTimesCount] = await sql`SELECT COUNT(*) as count FROM response_times`
    console.log(`⏱️ Tempos de resposta: ${responseTimesCount.count}`)

    // 3. Verificar dados recentes
    console.log("\n📈 3. DADOS RECENTES:")

    const recentConversations = await sql`
      SELECT conversation_id, customer_name, agent_name, agent_id, status, created_at 
      FROM conversations 
      ORDER BY created_at DESC 
      LIMIT 5
    `
    console.log("🔄 Últimas 5 conversas:")
    recentConversations.forEach((conv) => {
      console.log(
        `   - ${conv.conversation_id}: ${conv.customer_name} -> ${conv.agent_name} (ID: ${conv.agent_id || "N/A"}) [${conv.status}]`,
      )
    })

    const recentMessages = await sql`
      SELECT conversation_id, sender_type, sender_name, timestamp 
      FROM messages 
      ORDER BY timestamp DESC 
      LIMIT 5
    `
    console.log("📝 Últimas 5 mensagens:")
    recentMessages.forEach((msg) => {
      console.log(`   - ${msg.conversation_id}: ${msg.sender_type} (${msg.sender_name}) - ${msg.timestamp}`)
    })

    const recentResponseTimes = await sql`
      SELECT conversation_id, response_time_seconds, customer_message_time, agent_response_time 
      FROM response_times 
      ORDER BY created_at DESC 
      LIMIT 5
    `
    console.log("⏰ Últimos 5 tempos de resposta:")
    recentResponseTimes.forEach((rt) => {
      console.log(
        `   - ${rt.conversation_id}: ${rt.response_time_seconds}s (${rt.customer_message_time} -> ${rt.agent_response_time})`,
      )
    })

    // 4. Verificar métricas por agente
    console.log("\n👥 4. MÉTRICAS POR AGENTE:")

    const agentMetrics = await sql`
      SELECT 
        c.agent_name,
        COUNT(DISTINCT c.conversation_id) as total_conversations,
        COUNT(m.id) as total_messages,
        AVG(rt.response_time_seconds) as avg_response_time,
        COUNT(rt.id) as response_count
      FROM conversations c
      LEFT JOIN messages m ON c.conversation_id = m.conversation_id AND m.sender_type = 'agent'
      LEFT JOIN response_times rt ON c.conversation_id = rt.conversation_id
      WHERE c.agent_name IS NOT NULL
      GROUP BY c.agent_name
      ORDER BY avg_response_time ASC
      LIMIT 10
    `

    if (agentMetrics.length === 0) {
      console.log("❌ Nenhuma métrica de agente encontrada!")
    } else {
      agentMetrics.forEach((agent) => {
        console.log(
          `   - ${agent.agent_name}: ${agent.total_conversations} conversas, ${agent.response_count} respostas, ${Math.round(agent.avg_response_time || 0)}s médio`,
        )
      })
    }

    // 5. Verificar conversas pendentes
    console.log("\n⏳ 5. CONVERSAS PENDENTES:")

    const pendingConversations = await sql`
      WITH last_messages AS (
        SELECT DISTINCT ON (conversation_id) 
          conversation_id,
          sender_type,
          timestamp,
          sender_name
        FROM messages 
        ORDER BY conversation_id, timestamp DESC
      )
      SELECT 
        c.conversation_id,
        c.customer_name,
        c.agent_name,
        lm.sender_type as last_sender,
        EXTRACT(EPOCH FROM (NOW() - lm.timestamp))/60 as wait_time_minutes
      FROM conversations c
      JOIN last_messages lm ON c.conversation_id = lm.conversation_id
      WHERE lm.sender_type = 'customer' 
      AND c.status = 'active'
      ORDER BY wait_time_minutes DESC
      LIMIT 5
    `

    if (pendingConversations.length === 0) {
      console.log("✅ Nenhuma conversa pendente encontrada")
    } else {
      pendingConversations.forEach((conv) => {
        console.log(
          `   - ${conv.conversation_id}: ${conv.customer_name} aguarda ${Math.round(conv.wait_time_minutes)}min (agente: ${conv.agent_name})`,
        )
      })
    }

    console.log("\n✅ === DEBUG CONCLUÍDO ===")
  } catch (error) {
    console.error("❌ Erro durante debug:", error)
  }
}

debugDatabase()
