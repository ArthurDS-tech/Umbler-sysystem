#!/usr/bin/env node

/**
 * Script de teste para o webhook da Umbler
 * Simula os dados que seriam enviados pelo webhook
 */

const testWebhook = async () => {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/umbler'
  
  console.log('🧪 Testando webhook da Umbler...')
  console.log(`📍 URL: ${webhookUrl}`)
  
  // Dados de teste simulando uma mensagem de cliente
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
          Name: "Agente Teste",
          DisplayName: "Agente Teste"
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
  
  try {
    console.log('\n📤 Enviando dados de teste...')
    console.log('📝 Dados:', JSON.stringify(testData, null, 2))
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    console.log('\n📥 Resposta recebida:')
    console.log('📊 Status:', response.status)
    console.log('📝 Dados:', JSON.stringify(result, null, 2))
    
    if (response.ok && result.success) {
      console.log('\n✅ Webhook funcionando corretamente!')
    } else {
      console.log('\n❌ Webhook com problemas!')
    }
    
  } catch (error) {
    console.error('\n💥 Erro ao testar webhook:', error.message)
  }
}

// Executar teste
testWebhook()
