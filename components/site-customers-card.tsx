"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Users, CheckCircle, Clock } from "lucide-react"

interface SiteCustomersStats {
  totalSiteCustomers: number
  closedConversations: number
  activeConversations: number
  avgResponseTimeSeconds: number
}

export function SiteCustomersCard() {
  const [stats, setStats] = useState<SiteCustomersStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/site-customers/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}min`
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative group">
      <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#0BC4D9" }}>
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span style={{ color: "#3E403F" }}>Clientes do Site</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold mb-2" style={{ color: "#04BFAD" }}>
            {stats?.totalSiteCustomers || 0}
          </div>
          <p className="text-sm" style={{ color: "#3E403F", opacity: 0.7 }}>
            Total de clientes vindos do site
          </p>
        </CardContent>
      </Card>

      <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
        <div className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#3E403F" }}>
            <Users className="h-4 w-4" />
            Análise Completa dos Clientes do Site
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm" style={{ color: "#3E403F" }}>
                <CheckCircle className="h-4 w-4" style={{ color: "#04BFAD" }} />
                Atendimentos Finalizados
              </span>
              <span className="font-semibold" style={{ color: "#04BFAD" }}>
                {stats?.closedConversations || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm" style={{ color: "#3E403F" }}>
                <Clock className="h-4 w-4" style={{ color: "#06BFBF" }} />
                Atendimentos Ativos
              </span>
              <span className="font-semibold" style={{ color: "#06BFBF" }}>
                {stats?.activeConversations || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm" style={{ color: "#3E403F" }}>
                <Clock className="h-4 w-4" style={{ color: "#0BC4D9" }} />
                Tempo Médio de Resposta
              </span>
              <span className="font-semibold" style={{ color: "#0BC4D9" }}>
                {stats?.avgResponseTimeSeconds ? formatTime(stats.avgResponseTimeSeconds) : "N/A"}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t">
            <p className="text-xs" style={{ color: "#3E403F", opacity: 0.6 }}>
              Clientes identificados automaticamente através de mensagens e tags do site
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
