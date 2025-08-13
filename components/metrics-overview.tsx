"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MessageSquare, Users, Activity } from "lucide-react"
import { formatResponseTime, getResponseTimeBadgeColor } from "@/lib/utils"

interface SystemMetrics {
  total_conversations: number
  active_conversations: number
  total_messages: number
  total_response_times: number
  overall_avg_response_time: number
}

export function MetricsOverview() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch("/api/metrics")
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error("Erro ao carregar métricas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Atualiza a cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-8 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6 text-center text-gray-500">Erro ao carregar métricas</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_conversations}</div>
          <p className="text-xs text-muted-foreground">{metrics.active_conversations} ativas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_messages}</div>
          <p className="text-xs text-muted-foreground">Todas as mensagens processadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Respostas Medidas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_response_times}</div>
          <p className="text-xs text-muted-foreground">Tempos de resposta calculados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatResponseTime(Math.round(metrics.overall_avg_response_time || 0))}
          </div>
          <Badge className={getResponseTimeBadgeColor(metrics.overall_avg_response_time || 0)} variant="secondary">
            {metrics.overall_avg_response_time <= 30
              ? "Excelente"
              : metrics.overall_avg_response_time <= 120
                ? "Bom"
                : metrics.overall_avg_response_time <= 300
                  ? "Regular"
                  : "Lento"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
