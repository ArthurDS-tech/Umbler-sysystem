const testWebhook = async () => {
  const webhookUrl = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhook/umbler"

  const testPayload = {
    Type: "Message",
    EventDate: "2025-01-13T15:30:00.000Z",
    EventId: "test-123",
    Payload: {
      Type: "Chat",
      Content: {
        Id: "test-conversation-123",
        Contact: {
          Name: "ANDERSON FERRARI",
          Phone: "+5547999955497",
          Email: "anderson@test.com",
        },
        OrganizationMember: {
          Name: "DVA",
          DisplayName: "DVA Atendimento",
        },
        LastMessage: {
          Id: "msg-123",
          Content: "Olá, preciso de ajuda",
          Source: "Contact",
          IsPrivate: false,
          Member: null,
        },
      },
    },
  }

  try {
    console.log("🧪 Testando webhook...")
    console.log("📤 Payload:", JSON.stringify(testPayload, null, 2))

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    const result = await response.json()

    console.log("📥 Resposta:", response.status)
    console.log("📋 Resultado:", JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log("✅ Teste passou!")
    } else {
      console.log("❌ Teste falhou!")
    }
  } catch (error) {
    console.error("💥 Erro no teste:", error)
  }
}

testWebhook()
