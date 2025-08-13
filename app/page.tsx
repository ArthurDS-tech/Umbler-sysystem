import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, TrendingUp } from "lucide-react"
import { MetricsOverview } from "@/components/metrics-overview"
import { ConversationsList } from "@/components/conversations-list"
import { AgentPerformance } from "@/components/agent-performance"
import { SiteCustomersCard } from "@/components/site-customers-card"

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F2F2" }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header melhorado */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl text-white" style={{ backgroundColor: "#0BC4D9" }}>
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "#3E403F" }}>
                Sistema Umbler
              </h1>
              <p className="text-lg font-medium" style={{ color: "#3E403F", opacity: 0.7 }}>
                Atendimento & Métricas
              </p>
            </div>
          </div>
          <p className="max-w-2xl mx-auto" style={{ color: "#3E403F", opacity: 0.6 }}>
            Monitore tempos de resposta, performance dos atendentes e tags em tempo real
          </p>
        </div>

        {/* Card específico para clientes do site */}
        <div className="mb-8">
          <SiteCustomersCard />
        </div>

        {/* Métricas Gerais com design melhorado */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl h-32 shadow-sm" />
              ))}
            </div>
          }
        >
          <MetricsOverview />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Lista de Conversas - Ocupa 2 colunas */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="text-white rounded-t-lg" style={{ backgroundColor: "#06BFBF" }}>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <MessageSquare className="h-6 w-6" />
                  Conversas com Filtros Avançados
                </CardTitle>
                <CardDescription className="text-white opacity-90">
                  Filtre por atendente, tags e mensagens específicas do site
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ConversationsList />
              </CardContent>
            </Card>
          </div>

          {/* Performance dos Agentes */}
          <div className="xl:col-span-1">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="text-white rounded-t-lg" style={{ backgroundColor: "#04BFAD" }}>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <TrendingUp className="h-6 w-6" />
                  Performance
                </CardTitle>
                <CardDescription className="text-white opacity-90">Ranking por tempo médio de resposta</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-lg h-64" />}>
                  <AgentPerformance />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
