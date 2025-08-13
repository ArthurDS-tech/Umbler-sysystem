// Script para testar o webhook da Umbler
const webhookUrl = "http://localhost:3000/api/webhook/umbler"

// Exemplo de payload da Umbler - Mensagem do cliente
const messagePayload = {
  Type: "Message",
  EventDate: "2024-02-07T18:44:01.3135533Z",
  Payload: {
    Type: "Chat",
    Content: {
      Id: "chat_123456",
      Contact: {
        Name: "João Silva",
        Phone: "+5511999999999",
        Email: "joao@email.com",
      },
      OrganizationMember: {
        Name: "Maria Atendente",
      },
      LastMessage: {
        Id: "msg_001",
        Content: "Olá, preciso de ajuda com meu pedido",
        Source: "contact",
        IsPrivate: false,
      },
    },
  },
  EventId: "ZcPPcWpimiD3EiER",
}

// Exemplo de resposta do agente
const agentResponsePayload = {
  Type: "Message",
  EventDate: "2024-02-07T18:46:15.1234567Z",
  Payload: {
    Type: "Chat",
    Content: {
      Id: "chat_123456",
      Contact: {
        Name: "João Silva",
        Phone: "+5511999999999",
        Email: "joao@email.com",
      },
      OrganizationMember: {
        Name: "Maria Atendente",
      },
      LastMessage: {
        Id: "msg_002",
        Content: "Olá João! Claro, vou te ajudar. Qual é o número do seu pedido?",
        Source: "member",
        IsPrivate: false,
      },
    },
  },
  EventId: "AbCdEfGhIjKlMnOp",
}

// Exemplo de chat fechado
const chatClosedPayload = {
  Type: "ChatClosed",
  EventDate: "2024-02-07T19:00:00.0000000Z",
  Payload: {
    Type: "Chat",
    Content: {
      Id: "chat_123456",
    },
  },
  EventId: "ChatClosed123",
}

async function testWebhook(payload, description) {
  console.log(`\n🧪 Testando: ${description}`)
  console.log("Payload:", JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()
    console.log(`✅ Status: ${response.status}`)
    console.log("Resposta:", JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(`❌ Erro:`, error.message)
  }
}

async function runTests() {
  console.log("🚀 Iniciando testes do webhook da Umbler...")

  // Teste 1: Mensagem do cliente
  await testWebhook(messagePayload, "Mensagem do cliente")

  // Aguardar um pouco antes da próxima mensagem
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Teste 2: Resposta do agente (deve calcular tempo de resposta)
  await testWebhook(agentResponsePayload, "Resposta do agente")

  // Teste 3: Chat fechado
  await testWebhook(chatClosedPayload, "Chat fechado")

  console.log("\n✨ Testes concluídos!")
}

// Executar testes
runTests().catch(console.error)
