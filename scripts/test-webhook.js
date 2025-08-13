#!/usr/bin/env node

/**
 * Script de teste para o webhook da Umbler
 * Simula os dados que seriam enviados pelo webhook com nomes reais dos atendentes
 */

const atendentes = [
  "Ester Ramos",
  "Eticléia Kletenberg", 
  "Evylin Costa",
  "Fernanda Rovaris",
  "Fernando Marcelino",
  "Francilaine Rosa de Oliveira",
  "Helena Alves Iung",
  "Henry Fernandes dos Santos",
  "Isabella Reis Tacone",
  "Isabelle de Oliveira Guedes",
  "Janaina Dos Santos",
  "Janara Luana Copeti Teixeira",
  "Jessica Rocha Weber",
  "Joseane Macedo Padilha",
  "Josieli",
  "Julia Peres",
  "Karen Letícia Nunes de Ligório",
  "Karol",
  "Karol Machado",
  "Kenia Silva Veiga",
  "Lauren Silva",
  "Leticia Sodre Martins",
  "Lisiane Dalla Valle",
  "Manoela Bernardi",
  "Manuella Machado Cardoso",
  "Maria Julia Luiz de Sousa",
  "Micheli Castilhos",
  "Micheli M.",
  "Mirian Lemos",
  "Paola Davila Sagaz",
  "Patricia Pereira",
  "Pedro Moura",
  "Robson",
  "Sarah Vieira",
  "Wanessa Garcia",
  "Ana Costa"
];

const testWebhook = async () => {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/umbler'
  
  console.log('🧪 === TESTE DO WEBHOOK DA UMBLER ===')
  console.log(`📍 URL: ${webhookUrl}`)
  console.log(`👥 Total de atendentes: ${atendentes.length}`)
  
  // Teste 1: Mensagem de cliente (deve capturar o agente responsável)
  console.log('\n📤 === TESTE 1: MENSAGEM DE CLIENTE ===')
  const atendenteResponsavel = atendentes[Math.floor(Math.random() * atendentes.length)];
  
  const clienteData = {
    Type: "Message",
    EventDate: new Date().toISOString(),
    EventId: "cliente_" + Date.now(),
    Payload: {
      Type: "Chat",
      Content: {
        Id: "chat_cliente_" + Date.now(),
        Contact: {
          Name: "Cliente Teste",
          Phone: "+5511999999999",
          Email: "cliente@exemplo.com"
        },
        OrganizationMember: {
          Name: atendenteResponsavel,
          DisplayName: atendenteResponsavel
        },
        LastMessage: {
          Id: "msg_cliente_" + Date.now(),
          Content: "Olá, vim do site do marcelino",
          Source: "contact",
          IsPrivate: false,
          Member: null
        }
      }
    }
  }
  
  try {
    console.log(`👤 Agente responsável: ${atendenteResponsavel}`)
    console.log('📝 Enviando dados de cliente...')
    
    const clienteResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clienteData)
    })
    
    const clienteResult = await clienteResponse.json()
    console.log('📥 Resposta:', clienteResponse.status, clienteResult.success ? '✅' : '❌')
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Teste 2: Resposta do agente (deve capturar quem está enviando)
    console.log('\n📤 === TESTE 2: RESPOSTA DO AGENTE ===')
    const atendenteEnviando = atendentes[Math.floor(Math.random() * atendentes.length)];
    
    const agenteData = {
      Type: "Message",
      EventDate: new Date().toISOString(),
      EventId: "agente_" + Date.now(),
      Payload: {
        Type: "Chat",
        Content: {
          Id: clienteData.Payload.Content.Id, // Mesma conversa
          Contact: clienteData.Payload.Content.Contact,
          OrganizationMember: clienteData.Payload.Content.OrganizationMember,
          LastMessage: {
            Id: "msg_agente_" + Date.now(),
            Content: "Olá! Como posso te ajudar hoje?",
            Source: "member",
            IsPrivate: false,
            Member: {
              Name: atendenteEnviando,
              DisplayName: atendenteEnviando,
              Username: atendenteEnviando.toLowerCase().replace(/\s+/g, '.')
            }
          }
        }
      }
    }
    
    console.log(`🎧 Agente enviando: ${atendenteEnviando}`)
    console.log('📝 Enviando resposta do agente...')
    
    const agenteResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agenteData)
    })
    
    const agenteResult = await agenteResponse.json()
    console.log('📥 Resposta:', agenteResponse.status, agenteResult.success ? '✅' : '❌')
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Teste 3: Verificar dados salvos
    console.log('\n🔍 === TESTE 3: VERIFICANDO DADOS SALVOS ===')
    const debugResponse = await fetch(webhookUrl.replace('/webhook/umbler', '/debug/webhook-data'), {
      method: 'GET'
    })
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      console.log('📊 Mensagens recentes:', debugData.recent_messages?.length || 0)
      console.log('💬 Conversas recentes:', debugData.recent_conversations?.length || 0)
      
      if (debugData.recent_messages?.length > 0) {
        console.log('📝 Última mensagem:', debugData.recent_messages[0])
      }
    }
    
    console.log('\n✅ Teste concluído!')
    console.log('📋 Verifique os logs do servidor para mais detalhes')
    
  } catch (error) {
    console.error('\n💥 Erro ao testar webhook:', error.message)
  }
}

// Executar teste
testWebhook()
