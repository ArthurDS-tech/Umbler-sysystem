"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatResponseTime, getResponseTimeBadgeColor } from "@/lib/utils"
import { User, Clock, MessageSquare, AlertTriangle, CheckCircle, XCircle, Users, Globe, Phone } from "lucide-react"

interface AgentMetrics {
  agent_name: string
  total_conversations: number
  total_messages: number
  avg_response_time: number
  response_count: number
}

interface PendingConversation {
  conversation_id: string
  customer_name: string
  customer_phone?: string
  wait_time_minutes: number
  wait_time_formatted: string
  wait_time_category: "normal" | "attention" | "urgent"
  last_message_text: string
  last_customer_message_time?: string
}

interface AgentPerformanceDetails {
  agent_stats: {
    agent_name: string
    total_conversations: number
    active_conversations: number
    closed_conversations: number
    site_customers: number
    total_messages: number
    customer_messages: number
    agent_messages: number
    avg_response_time: number
    response_count: number
  }
  pending_conversations: PendingConversation[]
  recent_conversations: any[]
}

interface AgentPerformanceProps {
  selectedAgentFromFilter?: string
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

function calculateWaitTime(lastMessageTime: string): {
  minutes: number
  formatted: string
  category: "normal" | "attention" | "urgent"
} {
  const now = new Date()
  const lastMessage = new Date(lastMessageTime)
  const diffMs = now.getTime() - lastMessage.getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))

  let category: "normal" | "attention" | "urgent" = "normal"
  if (minutes > 60) category = "urgent"
  else if (minutes > 30) category = "attention"

  const formatted = minutes < 60 ? `${minutes}min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`

  return { minutes, formatted, category }
}

export function AgentPerformance({ selectedAgentFromFilter }: AgentPerformanceProps) {
  const [agents, setAgents] = useState<AgentMetrics[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [agentDetails, setAgentDetails] = useState<AgentPerformanceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch("/api/metrics")
        const data = await response.json()
        setAgents(data.agents || [])
      } catch (error) {
        console.error("Erro ao carregar agentes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
    const interval = setInterval(fetchAgents, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchAgentDetails() {
      if (!selectedAgent) {
        setAgentDetails(null)
        return
      }

      setDetailsLoading(true)
      try {
        const response = await fetch(`/api/agents/${encodeURIComponent(selectedAgent)}/performance`)
        const data = await response.json()
        if (data && !Array.isArray(data.pending_conversations)) {
          data.pending_conversations = []
        }
        setAgentDetails(data)
      } catch (error) {
        console.error("Erro ao carregar detalhes do agente:", error)
        setAgentDetails(null)
      } finally {
        setDetailsLoading(false)
      }
    }

    fetchAgentDetails()
    if (selectedAgent) {
      const interval = setInterval(fetchAgentDetails, 15000) // Update more frequently for selected agent
      return () => clearInterval(interval)
    }
  }, [selectedAgent])

  useEffect(() => {
    if (selectedAgentFromFilter !== undefined) {
      setSelectedAgent(selectedAgentFromFilter)
    }
  }, [selectedAgentFromFilter])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-2 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum agente encontrado</p>
      </div>
    )
  }

  const maxResponseTime = Math.max(...agents.map((a) => a.avg_response_time))

  const filteredAgents = agents.filter((agent) => REAL_ATTENDANTS.includes(agent.agent_name))

  const safePendingConversations = Array.isArray(agentDetails?.pending_conversations)
    ? agentDetails.pending_conversations.map((conv) => {
        if (conv.last_customer_message_time) {
          const waitTime = calculateWaitTime(conv.last_customer_message_time)
          return {
            ...conv,
            wait_time_minutes: waitTime.minutes,
            wait_time_formatted: waitTime.formatted,
            wait_time_category: waitTime.category,
          }
        }
        return conv
      })
    : []

  const urgentCount = safePendingConversations.filter((c) => c.wait_time_category === "urgent").length

  return (
    <div className="space-y-6">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredAgents.map((agent, index) => (
          <div
            key={agent.agent_name}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedAgent === agent.agent_name ? "border-blue-500 bg-blue-50" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedAgent(selectedAgent === agent.agent_name ? "" : agent.agent_name)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{agent.agent_name}</span>
                {index === 0 && (
                  <Badge variant="default" className="text-xs">
                    Melhor
                  </Badge>
                )}
                {selectedAgent === agent.agent_name && (
                  <Badge variant="outline" className="text-xs">
                    Selecionado
                  </Badge>
                )}
              </div>
              <Badge className={getResponseTimeBadgeColor(agent.avg_response_time)} variant="secondary">
                {formatResponseTime(Math.round(agent.avg_response_time))}
              </Badge>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Tempo de resposta</span>
                <span>{formatResponseTime(Math.round(agent.avg_response_time))}</span>
              </div>
              <Progress value={(agent.avg_response_time / maxResponseTime) * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{agent.total_conversations} conversas</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{agent.response_count} respostas</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAgent && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Performance Completa de {selectedAgent}</h3>
            {detailsLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />}
          </div>

          {agentDetails && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Total de Contatos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{agentDetails.agent_stats.total_conversations}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {agentDetails.agent_stats.active_conversations} ativas
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-gray-500" />
                        {agentDetails.agent_stats.closed_conversations} fechadas
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      Total de Mensagens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{agentDetails.agent_stats.total_messages || 0}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-blue-500" />
                        {agentDetails.agent_stats.customer_messages || 0} recebidas
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-green-500" />
                        {agentDetails.agent_stats.agent_messages || 0} enviadas
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-purple-500" />
                      Clientes do Site
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{agentDetails.agent_stats.site_customers || 0}</div>
                    <div className="text-xs text-gray-600">Clientes vindos do site</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Tempo Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatResponseTime(Math.round(agentDetails.agent_stats.avg_response_time))}
                    </div>
                    <Badge
                      className={`${getResponseTimeBadgeColor(agentDetails.agent_stats.avg_response_time)} text-white`}
                      variant="secondary"
                    >
                      {agentDetails.agent_stats.avg_response_time <= 30
                        ? "⚡ Excelente"
                        : agentDetails.agent_stats.avg_response_time <= 120
                          ? "✅ Bom"
                          : agentDetails.agent_stats.avg_response_time <= 300
                            ? "⚠️ Regular"
                            : "🔴 Lento"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Status Atual - Aguardando Resposta
                    <Badge variant="outline" className="text-xs">
                      {safePendingConversations.length} conversas
                    </Badge>
                  </CardTitle>
                  <CardDescription>Clientes que enviaram mensagem e estão esperando resposta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {safePendingConversations.filter((c) => c.wait_time_category === "normal").length}
                      </div>
                      <div className="text-xs text-green-700">Normal (&lt;30min)</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {safePendingConversations.filter((c) => c.wait_time_category === "attention").length}
                      </div>
                      <div className="text-xs text-yellow-700">Atenção (30-60min)</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
                      <div className="text-xs text-red-700">Urgente (&gt;60min)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Conversations Details */}
              {safePendingConversations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Detalhes dos Clientes Aguardando
                      <Badge variant="outline" className="text-xs">
                        Atualizado: {currentTime.toLocaleTimeString()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {safePendingConversations.map((conv) => (
                        <div
                          key={conv.conversation_id}
                          className={`p-3 rounded-lg border-l-4 ${
                            conv.wait_time_category === "urgent"
                              ? "border-red-500 bg-red-50"
                              : conv.wait_time_category === "attention"
                                ? "border-yellow-500 bg-yellow-50"
                                : "border-green-500 bg-green-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">{conv.customer_name}</div>
                            <Badge
                              className={`text-white ${
                                conv.wait_time_category === "urgent"
                                  ? "bg-red-500"
                                  : conv.wait_time_category === "attention"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                            >
                              {conv.wait_time_formatted}
                            </Badge>
                          </div>
                          {conv.customer_phone && (
                            <div className="text-xs text-gray-600 mb-1">{conv.customer_phone}</div>
                          )}
                          <div className="text-xs text-gray-700 bg-white p-2 rounded">
                            "{conv.last_message_text?.substring(0, 100)}..."
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
