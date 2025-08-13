"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatResponseTime, getResponseTimeBadgeColor } from "@/lib/utils"
import { User, Clock, MessageSquare } from "lucide-react"

interface AgentMetrics {
  agent_name: string
  total_conversations: number
  total_messages: number
  avg_response_time: number
  response_count: number
}

export function AgentPerformance() {
  const [agents, setAgents] = useState<AgentMetrics[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {agents.map((agent, index) => (
        <div key={agent.agent_name} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{agent.agent_name}</span>
              {index === 0 && (
                <Badge variant="default" className="text-xs">
                  Melhor
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
  )
}
