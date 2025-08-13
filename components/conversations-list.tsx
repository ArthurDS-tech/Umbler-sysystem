"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { formatResponseTime } from "@/lib/utils"
import { Eye, Clock, MessageSquare, User, Filter, X } from "lucide-react"
import Link from "next/link"

interface ConversationMetrics {
  conversation_id: string
  customer_name?: string
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

const TEAM_AGENTS = [
  "Fpolis Principal - Isa",
  "Fpolis - Julia I",
  "Fpolis - Ester",
  "Fpolis - Kenia",
  "DVA - Patricia",
  "DVA - Isabella",
  "Fpolis - Paola",
  "DVA - Eticleia",
  "Auto Facil Gestora",
  "SJ - Micheli",
  "SJ - Principal Ana",
  "SJ - Evylin",
  "SJ - Micheli Maia",
  "SJ - Cris",
  "PH - Karol Lojas",
  "PH - Amanda",
  "PH - Robson",
  "SJ - Adrielli",
  "DVA - Manu",
  "Lojas Lojistas - Josieli",
  "Lojas - Maria Julia",
  "Lojas Localiza - Janaina",
  "Lojas Pemavel - Andreyna",
  "Lojas RB - Josieli",
  "Jana - Pasta A. Marcelino",
  "Jana - Pasta A. Auto Facil",
  "Lojas HM - Manoela Bernardi",
  "Particular - São José",
  "Lojas - A definir (Antigo Gustavo)",
  "DVA - Francieli",
  "Dva - Ana Paula",
  "Lojas - Joseane",
  "Fpolis - Sarah",
  "Lojas Pemavel - Ana",
  "Lojas - Janara",
  "Dva - Sem nome",
  "Particular - Florianópolis",
  "DVA - Simone",
  "DVA - Andresa",
  "DVA - Janaina",
  "DVA - Beatriz",
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

export function ConversationsList() {
  const [conversations, setConversations] = useState<ConversationMetrics[]>([])
  const [filteredConversations, setFilteredConversations] = useState<ConversationMetrics[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>(["CLIENTE SITE"]) // Padrão: CLIENTE SITE selecionado
  const [onlySiteMessages, setOnlySiteMessages] = useState<boolean>(false)
  const [agents, setAgents] = useState<string[]>([])

  useEffect(() => {
    async function fetchConversations() {
      try {
        // Usando endpoints corretos que já existem
        const endpoint = onlySiteMessages ? "/api/conversations/site-customers" : "/api/conversations"
        const response = await fetch(endpoint)
        const conversationsData = await response.json()

        if (Array.isArray(conversationsData)) {
          setConversations(conversationsData)

          const uniqueAgents = [
            ...new Set([
              ...conversationsData.map((conv: ConversationMetrics) => conv.agent_name).filter(Boolean),
              ...TEAM_AGENTS,
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
  }, [onlySiteMessages])

  useEffect(() => {
    let filtered = conversations

    if (selectedAgent) {
      filtered = filtered.filter((conv) => conv.agent_name === selectedAgent)
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        (conv) => conv.tags && Array.isArray(conv.tags) && conv.tags.some((tag) => selectedTags.includes(tag)),
      )
    }

    setFilteredConversations(filtered)
  }, [conversations, selectedAgent, selectedTags, onlySiteMessages])

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
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4 bg-white">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0BC4D9" }}>
            <Filter className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: "#3E403F" }}>
            Filtros
          </h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
              Filtro Especial
            </label>
            <Button
              onClick={() => setOnlySiteMessages(!onlySiteMessages)}
              className={`w-full justify-start transition-all ${
                onlySiteMessages ? "text-white shadow-md" : "bg-white border-2 hover:shadow-sm"
              }`}
              style={{
                backgroundColor: onlySiteMessages ? "#06BFBF" : "white",
                borderColor: onlySiteMessages ? "#06BFBF" : "#e5e7eb",
                color: onlySiteMessages ? "white" : "#3E403F",
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {onlySiteMessages ? "Clientes do Site Ativo" : "Filtrar por mensagem do site"}
            </Button>
            {onlySiteMessages && (
              <div className="text-xs p-3 rounded-lg border" style={{ backgroundColor: "#F2F2F2", color: "#3E403F" }}>
                Mostrando apenas conversas que começaram com "Olá, vim do site do Marcelino, você pode me ajudar"
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
              ATENDENTES:
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-0 transition-colors"
              style={{
                borderColor: selectedAgent ? "#04BFAD" : "#e5e7eb",
                color: "#3E403F",
              }}
            >
              <option value="">Todos os Atendentes</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: "#3E403F" }}>
              TAGS:
            </label>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 rounded-lg border"
              style={{ backgroundColor: "#F2F2F2", borderColor: "#e5e7eb" }}
            >
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all hover:shadow-sm ${
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

          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-sm" style={{ color: "#3E403F" }}>
              Mostrando <span className="font-semibold">{filteredConversations.length}</span> de{" "}
              <span className="font-semibold">{conversations.length}</span> conversas
              {onlySiteMessages && (
                <span
                  className="ml-2 px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: "#0BC4D9" }}
                >
                  Clientes do Site
                </span>
              )}
              {conversations.length > 20 && (
                <Button
                  asChild
                  size="sm"
                  className="ml-3 text-white hover:shadow-md transition-all"
                  style={{ backgroundColor: "#06BFBF" }}
                >
                  <Link href="/conversations">
                    <Eye className="h-3 w-3 mr-1" />
                    Ver Todas ({conversations.length})
                  </Link>
                </Button>
              )}
            </div>
            {(selectedAgent ||
              selectedTags.length !== 1 ||
              !selectedTags.includes("CLIENTE SITE") ||
              onlySiteMessages) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAgent("")
                  setSelectedTags(["CLIENTE SITE"])
                  setOnlySiteMessages(false)
                }}
                className="border-2 hover:shadow-sm transition-all"
                style={{ borderColor: "#e5e7eb", color: "#3E403F" }}
              >
                <X className="h-3 w-3 mr-1" />
                Resetar
              </Button>
            )}
          </div>
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "#F2F2F2" }}
          >
            <MessageSquare className="h-8 w-8" style={{ color: "#3E403F" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#3E403F" }}>
            {conversations.length === 0 ? "Aguardando Conversas" : "Nenhuma Conversa Encontrada"}
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "#3E403F", opacity: 0.7 }}>
            {conversations.length === 0
              ? "As conversas aparecerão aqui automaticamente quando chegarem via webhook da Umbler"
              : "Tente ajustar os filtros acima para encontrar as conversas que você procura"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredConversations.slice(0, 20).map((conversation) => (
            <div
              key={conversation.conversation_id}
              className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-semibold text-xs"
                    style={{ backgroundColor: "#0BC4D9" }}
                  >
                    {(conversation.customer_name || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold" style={{ color: "#3E403F" }}>
                        {conversation.customer_name || `Conversa ${conversation.conversation_id.slice(-8)}`}
                      </h4>
                      {conversation.tags &&
                        Array.isArray(conversation.tags) &&
                        conversation.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: "#04BFAD" }}
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#3E403F", opacity: 0.7 }}>
                      <User className="h-3 w-3" />
                      <span>
                        Atendente: <span className="font-medium">{conversation.agent_name || "Não atribuído"}</span>
                      </span>
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

              <div
                className="flex items-center justify-between text-xs mb-2 p-2 rounded-lg"
                style={{ backgroundColor: "#F2F2F2", color: "#3E403F" }}
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span className="font-medium">{conversation.total_messages}</span> mensagens
                  </span>
                  <span>Atualizado: {new Date(conversation.updated_at).toLocaleString("pt-BR")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ backgroundColor: "#F2F2F2" }}>
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
  )
}
