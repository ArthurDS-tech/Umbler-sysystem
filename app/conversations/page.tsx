"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatResponseTime } from "@/lib/utils"
import { Eye, Clock, MessageSquare, User, Search, ArrowLeft, Phone, Mail, BarChart3 } from "lucide-react"
import Link from "next/link"
import { AgentPerformance } from "@/components/agent-performance"

interface ConversationMetrics {
  conversation_id: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  agent_name?: string
  total_messages: number
  customer_messages: number
  agent_messages: number
  avg_response_time: number
  status: string
  updated_at: string
  tags: string[]
  is_site_customer?: boolean
}

const REAL_ATTENDANTS = [
  "Adrielli Saturnino",
  "Amanda Arruda",
  "ANA PAULA GOMES LOPES",
  "Ana Paula Prates",
  "Andresa Oliveira",
  "Andreyna Jamilly",
  "Arthur Schuster",
  "Beatriz Padilha",
  "Bruna Machado",
  "Bruna Rosângela dos Santos",
  "Cristiane Santos Sousa",
  "Ester Ramos",
  "Eticléia Kletenberg",
  "Evylin Costa",
  "Fernando Marcelino",
  "Francilaine Rosa de Oliveira",
  "Helena Alves Iung",
  "Henry Fernandes dos Santos",
  "Isabella Reis TAcone",
  "Isabelle de Oliveira Guedes",
  "Janaina Dos Santos",
  "Janara Luana Copeti Teixeira",
  "Josieli",
  "JULIA PERES 💙",
  "Karen Letícia Nunes de Ligório",
  "Karol 💙",
  "Karol Machado",
  "kenia silva veiga",
  "Lauren Silva",
  "Leticia Sodre Martins",
  "Lisiane Dalla Valle",
  "Manoela Bernardi",
  "Manuella Machado Cardoso",
  "Maria Julia Luiz de Sousa",
  "Micheli Castilhos",
  "Micheli.M 💙",
  "Mirian Lemos",
  "Paola Davila Sagaz",
  "Patricia Pereira",
  "Pedro Moura",
  "Robson",
  "Sarah Vieira",
  "Wanessa Garcia",
]

const AVAILABLE_TAGS = [
  "CLIENTE SITE",
  "SUPORTE",
  "BMW VEICULOS",
  "BMW MOTOS",
  "BMW MINI COOPER",
  "REPECON FIAT",
  "AUTOMEGA",
  "LOJISTA",
  "DICAS",
  "PIX VISTORIA",
  "CLIENTE BALCAO",
  "PV",
  "Troca",
  "Zero",
  "zero fora",
  "seminovo",
  "Site AF PH",
  "Realizado",
  "Não realizado",
  "Qualificação",
  "Pendente",
  "Orçamento Enviado",
  "PGTO",
  "Grupos",
  "AVISO",
  "ZERO TUDO",
  "ZERO ESCOLHA",
  "TROCA ESCOLHA",
  "TROCA TUDO",
  "Aguardando Verificação",
  "Blumenau",
  "RECALL",
  "Resolvendo com COO",
  "BLUMENAU",
  "Negociando",
  "Parceiro",
  "Doc VD",
  "Chapecó",
  "Floripa",
  "Itajaí",
  "São José",
]

export default function AllConversationsPage() {
  const [conversations, setConversations] = useState<ConversationMetrics[]>([])
  const [filteredConversations, setFilteredConversations] = useState<ConversationMetrics[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedResponseTime, setSelectedResponseTime] = useState<string>("")
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [agents, setAgents] = useState<string[]>([])

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch("/api/conversations")
        const conversationsData = await response.json()

        if (Array.isArray(conversationsData)) {
          setConversations(conversationsData)

          const uniqueAgents = [
            ...new Set([
              ...conversationsData
                .map((conv: ConversationMetrics) => conv.agent_name)
                .filter((name) => name && REAL_ATTENDANTS.includes(name)),
              ...REAL_ATTENDANTS,
            ]),
          ].sort()
          setAgents(uniqueAgents)
        }
      } catch (error) {
        console.error("Erro ao carregar conversas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
    const interval = setInterval(fetchConversations, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = conversations

    // Filtro por busca (nome, telefone, email)
    if (searchTerm) {
      filtered = filtered.filter(
        (conv) =>
          conv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.customer_phone?.includes(searchTerm) ||
          conv.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.conversation_id.includes(searchTerm),
      )
    }

    // Filtro por agente
    if (selectedAgent) {
      filtered = filtered.filter((conv) => conv.agent_name === selectedAgent)
    }

    // Filtro por tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        (conv) => conv.tags && Array.isArray(conv.tags) && conv.tags.some((tag) => selectedTags.includes(tag)),
      )
    }

    // Filtro por status
    if (selectedStatus) {
      filtered = filtered.filter((conv) => conv.status === selectedStatus)
    }

    // Filtro por tempo de resposta
    if (selectedResponseTime) {
      filtered = filtered.filter((conv) => {
        const { category } = getResponseTimeCategory(conv.avg_response_time || 0)
        return category === selectedResponseTime
      })
    }

    // Filtro por período de tempo
    if (selectedTimeRange) {
      const now = new Date()
      let startTime: Date

      switch (selectedTimeRange) {
        case "1h":
          startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000)
          break
        case "6h":
          startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
          break
        case "24h":
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startTime = new Date(0)
      }

      filtered = filtered.filter((conv) => new Date(conv.updated_at) >= startTime)
    }

    // Filtro por data específica
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate)
      const nextDay = new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000)

      filtered = filtered.filter((conv) => {
        const convDate = new Date(conv.updated_at)
        return convDate >= selectedDateObj && convDate < nextDay
      })
    }

    setFilteredConversations(filtered)
  }, [
    conversations,
    searchTerm,
    selectedAgent,
    selectedTags,
    selectedStatus,
    selectedResponseTime,
    selectedTimeRange,
    selectedDate,
  ])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const getResponseTimeCategory = (responseTimeSeconds: number) => {
    const minutes = responseTimeSeconds / 60

    if (minutes <= 10) {
      return { category: "Excelente", color: "#04BFAD" }
    } else if (minutes <= 15) {
      return { category: "Médio", color: "#FF8C00" } // Laranja
    } else {
      return { category: "Demorado", color: "#FF4444" } // Vermelho
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F2F2F2" }}>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4 bg-white">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F2F2" }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-2 hover:shadow-sm transition-all bg-transparent"
              style={{ borderColor: "#e5e7eb", color: "#3E403F" }}
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#3E403F" }}>
                Todas as Conversas
              </h1>
              <p className="text-sm" style={{ color: "#3E403F", opacity: 0.7 }}>
                Visualize e filtre todas as conversas do sistema
              </p>
            </div>
          </div>

          {/* Agent Performance Component */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#0BC4D9" }}
              >
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "#3E403F" }}>
                  PerformanceRanking por tempo médio de resposta
                </h3>
                <p className="text-sm" style={{ color: "#3E403F", opacity: 0.7 }}>
                  Ranking dos atendentes por performance e métricas detalhadas
                </p>
              </div>
            </div>

            <AgentPerformance selectedAgentFromFilter={selectedAgent} />
          </div>

          {/* Filtros Avançados */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {/* Busca */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                  Buscar
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    style={{ color: "#3E403F", opacity: 0.5 }}
                  />
                  <Input
                    placeholder="Nome, telefone, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 focus:outline-none focus:ring-0"
                    style={{
                      borderColor: searchTerm ? "#04BFAD" : "#e5e7eb",
                      color: "#3E403F",
                    }}
                  />
                </div>
              </div>

              {/* Agente */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                  Atendente
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-0"
                  style={{
                    borderColor: selectedAgent ? "#04BFAD" : "#e5e7eb",
                    color: "#3E403F",
                  }}
                >
                  <option value="">Todos</option>
                  {agents.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tempo de Resposta */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                  Tempo de Resposta
                </label>
                <select
                  value={selectedResponseTime}
                  onChange={(e) => setSelectedResponseTime(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-0"
                  style={{
                    borderColor: selectedResponseTime ? "#04BFAD" : "#e5e7eb",
                    color: "#3E403F",
                  }}
                >
                  <option value="">Todos</option>
                  <option value="Excelente">Excelente (0-10min)</option>
                  <option value="Médio">Médio (10-15min)</option>
                  <option value="Demorado">Demorado (15+min)</option>
                </select>
              </div>

              {/* Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                  Período
                </label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-0"
                  style={{
                    borderColor: selectedTimeRange ? "#04BFAD" : "#e5e7eb",
                    color: "#3E403F",
                  }}
                >
                  <option value="">Todos</option>
                  <option value="1h">Última hora</option>
                  <option value="6h">Últimas 6 horas</option>
                  <option value="24h">Últimas 24 horas</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-0"
                  style={{
                    borderColor: selectedStatus ? "#04BFAD" : "#e5e7eb",
                    color: "#3E403F",
                  }}
                >
                  <option value="">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>

              {/* Data Específica */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                  Data Específica
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-0"
                  style={{
                    borderColor: selectedDate ? "#04BFAD" : "#e5e7eb",
                    color: "#3E403F",
                  }}
                />
              </div>

              {/* Resultados */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                  Resultados
                </label>
                <div
                  className="flex items-center h-10 px-4 py-2 border-2 rounded-lg bg-gray-50"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "#3E403F" }}>
                    {filteredConversations.length} de {conversations.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
                Tags
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:shadow-sm ${
                      selectedTags.includes(tag) ? "text-white shadow-md" : "bg-white hover:shadow-sm"
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag) ? "#04BFAD" : "white",
                      borderColor: selectedTags.includes(tag) ? "#04BFAD" : "#e5e7eb",
                      color: selectedTags.includes(tag) ? "white" : "#3E403F",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Conversas */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#F2F2F2" }}
            >
              <MessageSquare className="h-8 w-8" style={{ color: "#3E403F" }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#3E403F" }}>
              Nenhuma Conversa Encontrada
            </h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#3E403F", opacity: 0.7 }}>
              Tente ajustar os filtros acima para encontrar as conversas que você procura
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.conversation_id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: "#0BC4D9" }}
                    >
                      {(conversation.customer_name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1" style={{ color: "#3E403F" }}>
                        {conversation.customer_name || `Conversa ${conversation.conversation_id.slice(-8)}`}
                      </h4>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "#3E403F", opacity: 0.7 }}>
                        {conversation.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {conversation.customer_phone}
                          </span>
                        )}
                        {conversation.customer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {conversation.customer_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                    style={{
                      backgroundColor: conversation.status === "active" ? "#06BFBF" : "#3E403F",
                    }}
                  >
                    {conversation.status === "active" ? "Ativo" : "Fechado"}
                  </span>
                </div>

                {/* Tags */}
                {conversation.tags && Array.isArray(conversation.tags) && conversation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {conversation.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: "#04BFAD" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Métricas */}
                <div
                  className="flex items-center justify-between text-xs mb-3 p-2 rounded-lg"
                  style={{ backgroundColor: "#F2F2F2", color: "#3E403F" }}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className="font-medium">{conversation.total_messages}</span> mensagens
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {conversation.agent_name || "Não atribuído"}
                    </span>
                  </div>
                  <span>{new Date(conversation.updated_at).toLocaleString("pt-BR")}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-2 px-2 py-1 rounded-lg"
                      style={{ backgroundColor: "#F2F2F2" }}
                    >
                      <Clock className="h-3 w-3" style={{ color: "#3E403F" }} />
                      <span className="font-medium text-xs" style={{ color: "#3E403F" }}>
                        {formatResponseTime(Math.round(conversation.avg_response_time || 0))}
                      </span>
                    </div>
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                      style={{
                        backgroundColor: getResponseTimeCategory(conversation.avg_response_time || 0).color,
                      }}
                    >
                      {getResponseTimeCategory(conversation.avg_response_time || 0).category}
                    </span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="text-white hover:shadow-md transition-all text-xs px-3 py-1"
                    style={{ backgroundColor: "#06BFBF" }}
                  >
                    <Link href={`/conversation/${conversation.conversation_id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Conversa
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
