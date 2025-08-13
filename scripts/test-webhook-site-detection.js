// Test script to verify site customer detection and tag processing
import { DatabaseService } from "../lib/database.js"

// Simulate the exact message you sent
const testMessage = "Olá, vim do site do Marcelino, você pode me ajudar?"

// Test the site detection function
function detectSiteCustomer(messageText, chatData = {}) {
  try {
    const lowerMessage = messageText.toLowerCase()
    console.log("🔍 Testing message:", messageText)
    console.log("🔍 Lowercase message:", lowerMessage)

    // Common patterns that indicate a customer came from the website
    const sitePatterns = [
      /ol[aá],?\s*vim do site/i,
      /ol[aá],?\s*encontrei voc[eê]s no site/i,
      /vi no site/i,
      /encontrei no site/i,
      /pelo site/i,
      /atrav[eé]s do site/i,
      /formulário do site/i,
      /contato do site/i,
      /p[aá]gina web/i,
      /website/i,
      /marcelino.*site/i,
      /site.*marcelino/i,
    ]

    // Check message content for site indicators
    for (const pattern of sitePatterns) {
      console.log(`🔍 Testing pattern: ${pattern.source}`)
      if (pattern.test(lowerMessage)) {
        console.log(`✅ MATCH! Cliente do site detectado por padrão: "${pattern.source}"`)
        return true
      } else {
        console.log(`❌ No match for pattern: ${pattern.source}`)
      }
    }

    return false
  } catch (error) {
    console.error("❌ Error detecting site customer:", error)
    return false
  }
}

// Test all the tags from the user's list
const ALL_TAGS = [
  "Troca",
  "Devolução",
  "Cancelamento",
  "Reembolso",
  "Produto com defeito",
  "Produto não chegou",
  "Produto errado",
  "Atraso na entrega",
  "Entrega",
  "Pagamento",
  "Boleto",
  "Cartão",
  "Pix",
  "Parcelamento",
  "Desconto",
  "Cupom",
  "Promoção",
  "Frete",
  "Cálculo de frete",
  "Frete grátis",
  "Disponibilidade",
  "Estoque",
  "Tamanho",
  "Cor",
  "Modelo",
  "Medidas",
  "Informações do produto",
  "Como usar",
  "Garantia",
  "Assistência técnica",
  "Cadastro",
  "Login",
  "Senha",
  "Dados pessoais",
  "Endereço",
  "Telefone",
  "Email",
  "CPF",
  "CNPJ",
  "Inscrição estadual",
  "Nota fiscal",
  "Danfe",
  "Comprovante",
  "Recibo",
  "Certificado",
  "Orçamento",
  "Cotação",
  "Proposta",
  "Contrato",
  "Pedido",
  "Venda",
  "Compra",
  "Negociação",
  "Condições",
  "Prazo",
  "Qualidade",
  "Satisfação",
  "Reclamação",
  "Sugestão",
  "Elogio",
  "Crítica",
  "Feedback",
  "Avaliação",
  "Pesquisa",
  "Opinião",
  "Suporte",
  "Ajuda",
  "Dúvida",
  "Problema",
  "Solução",
  "Orientação",
  "Instrução",
  "Manual",
  "Tutorial",
  "Passo a passo",
  "Site",
  "App",
  "Sistema",
  "Plataforma",
  "Tecnologia",
  "Bug",
  "Erro",
  "Falha",
  "Lentidão",
  "Indisponibilidade",
  "Manutenção",
  "Atualização",
  "Versão",
  "Funcionalidade",
  "Recurso",
  "Configuração",
  "Personalização",
  "Customização",
  "Integração",
  "API",
  "Relatório",
  "Dashboard",
  "Gráfico",
  "Estatística",
  "Métrica",
  "Análise",
  "Dados",
  "Informação",
  "Consulta",
  "Pesquisa",
  "Filtro",
  "Busca",
  "Ordenação",
  "Classificação",
  "Categoria",
  "Tag",
  "Etiqueta",
  "Marcação",
  "Identificação",
  "Rotulação",
  "Transferencia",
  "Encaminhamento",
  "Redirecionamento",
  "Passagem",
  "Mudança",
]

function testTagDetection(messageText) {
  console.log("\n🏷️ === TESTING TAG DETECTION ===")

  const tagAddedPatterns = [
    /etiqueta adicionada na conversa[:\s]*([^.\n]+)/i,
    /tag adicionada[:\s]*([^.\n]+)/i,
    /adicionada a etiqueta[:\s]*([^.\n]+)/i,
    /nova etiqueta[:\s]*([^.\n]+)/i,
  ]

  // Test each tag with different message formats
  ALL_TAGS.forEach((tag) => {
    const testMessages = [
      `Etiqueta adicionada na conversa: ${tag}`,
      `Tag adicionada: ${tag}`,
      `Adicionada a etiqueta ${tag}`,
      `Nova etiqueta: ${tag}`,
    ]

    testMessages.forEach((testMsg) => {
      for (const pattern of tagAddedPatterns) {
        const match = testMsg.match(pattern)
        if (match) {
          const detectedTag = match[1].trim()
          if (detectedTag === tag) {
            console.log(`✅ Tag "${tag}" detectada corretamente em: "${testMsg}"`)
          } else {
            console.log(`❌ Tag "${tag}" não detectada corretamente. Detectou: "${detectedTag}"`)
          }
          break
        }
      }
    })
  })
}

// Simulate a complete webhook payload
const simulateWebhookPayload = {
  Type: "Message",
  EventDate: new Date().toISOString(),
  EventId: "TEST_EVENT_123",
  Payload: {
    Type: "Chat",
    Content: {
      Id: "TEST_CONVERSATION_123",
      Contact: {
        Name: "Cliente Teste",
        PhoneNumber: "+5511999999999",
        Email: "teste@email.com",
      },
      LastMessage: {
        Id: "TEST_MESSAGE_123",
        Content: testMessage,
        Source: "Contact",
        IsPrivate: false,
        Sender: {
          Id: "CUSTOMER_ID",
          Name: "Cliente Teste",
        },
      },
      LastOrganizationMember: {
        Id: "ZrzsX_BLm_zYqujY", // Adrielli Saturnino
      },
      OrganizationMembers: [
        {
          Id: "ZrzsX_BLm_zYqujY",
          Name: "Adrielli Saturnino",
          DisplayName: "Adrielli",
        },
      ],
      Tags: ["Site", "Novo Cliente"],
    },
  },
}

async function runTests() {
  console.log("🧪 === INICIANDO TESTES DE DETECÇÃO ===\n")

  // Test 1: Site customer detection
  console.log("🌐 === TESTE 1: DETECÇÃO CLIENTE DO SITE ===")
  const isSiteCustomer = detectSiteCustomer(testMessage)
  console.log(`Resultado: ${isSiteCustomer ? "✅ DETECTADO" : "❌ NÃO DETECTADO"}`)

  // Test 2: Tag detection
  testTagDetection()

  // Test 3: Simulate webhook call
  console.log("\n📡 === TESTE 3: SIMULAÇÃO WEBHOOK ===")
  console.log("Payload simulado:", JSON.stringify(simulateWebhookPayload, null, 2))

  // Test 4: Check database connection
  console.log("\n💾 === TESTE 4: CONEXÃO BANCO DE DADOS ===")
  try {
    // Try to get conversations to test database connection
    const conversations = await DatabaseService.getConversationsWithMetrics()
    console.log(`✅ Conexão com banco OK. ${conversations.length} conversas encontradas.`)
  } catch (error) {
    console.error("❌ Erro na conexão com banco:", error.message)
  }

  console.log("\n🏁 === TESTES CONCLUÍDOS ===")
}

// Run the tests
runTests().catch(console.error)
