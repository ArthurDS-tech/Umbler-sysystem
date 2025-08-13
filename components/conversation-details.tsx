"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatResponseTime, getResponseTimeBadgeColor } from "@/lib/utils"
import { Clock, MessageSquare, User, Headphones, RefreshCw } from "lucide-react"

interface Message {
  id: number
  message_id?: string
  sender_type: "customer" | "agent"
  sender_name?: string
  message_text?: string
  timestamp: string
  response_time_seconds?: number
  agent_response_time?: string
}

interface ResponseTime {
  customer_message_time: string
  agent_response_time?: string
  response_time_seconds?: number
}

interface ConversationData {
  conversation_id: string
  messages: Message[]
  response_times: ResponseTime[]
}

interface ConversationDetailsProps {
  conversationId: string
}

export function ConversationDetails({ conversationId }: ConversationDetailsProps) {
  const [data, setData] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConversation() {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`)
        const messages = await response.json()

        const responseTimesResponse = await fetch(`/api/conversations/${conversationId}/response-times`)
        const response_times = await responseTimesResponse.json()

        setData({
          conversation_id: conversationId,
          messages,
          response_times,
        })
      } catch (error) {
        console.error("Erro ao carregar conversa:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()

    const interval = setInterval(fetchConversation, 15000)
    return () => clearInterval(interval)
  }, [conversationId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded mb-4" />
            <div className="h-32 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">Conversa não encontrada</CardContent>
      </Card>
    )
  }

  const avgResponseTime =
    data.response_times.length > 0
      ? data.response_times.reduce((sum, rt) => sum + (rt.response_time_seconds || 0), 0) / data.response_times.length
      : 0

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Conversa #{conversationId.slice(-8)}
              </CardTitle>
              <CardDescription className="mt-1">Análise detalhada de tempo de resposta por mensagem</CardDescription>
            </div>
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white">💙 CLIENTE SITE</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas da Conversa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Total de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.messages.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600 font-medium">
                {data.messages.filter((m) => m.sender_type === "customer").length} do cliente
              </span>
              {" • "}
              <span className="text-green-600 font-medium">
                {data.messages.filter((m) => m.sender_type === "agent").length} do agente
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Tempo Médio de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatResponseTime(Math.round(avgResponseTime))}</div>
            <Badge
              className={`${getResponseTimeBadgeColor(avgResponseTime)} text-white font-medium`}
              variant="secondary"
            >
              {avgResponseTime <= 30
                ? "⚡ Excelente"
                : avgResponseTime <= 120
                  ? "✅ Bom"
                  : avgResponseTime <= 300
                    ? "⚠️ Regular"
                    : "🔴 Lento"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              Respostas Medidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.response_times.length}</div>
            <p className="text-xs text-muted-foreground">Tempos de resposta calculados automaticamente</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Timeline de Mensagens
          </CardTitle>
          <CardDescription>
            Histórico completo da conversa com tempo de resposta para cada mensagem do cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
            {data.messages.map((message, index) => {
              return (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.sender_type === "agent" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                      message.sender_type === "customer"
                        ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                        : "bg-gradient-to-r from-green-400 to-green-500 text-white"
                    }`}
                  >
                    {message.sender_type === "customer" ? (
                      <User className="h-6 w-6" />
                    ) : (
                      <Headphones className="h-6 w-6" />
                    )}
                  </div>

                  <div className={`flex-1 max-w-md ${message.sender_type === "agent" ? "text-right" : ""}`}>
                    <div className={`mb-2 ${message.sender_type === "agent" ? "text-right" : ""}`}>
                      <Badge
                        className={`text-sm font-semibold px-3 py-1 ${
                          message.sender_type === "customer"
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {message.sender_type === "customer" ? "👤 CLIENTE" : "🎧 ATENDENTE"}
                        {message.sender_name && ` • ${message.sender_name}`}
                      </Badge>
                    </div>

                    <div
                      className={`inline-block max-w-full px-4 py-3 rounded-2xl shadow-sm border ${
                        message.sender_type === "customer"
                          ? "bg-white border-blue-200 text-gray-900 rounded-bl-sm"
                          : "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-sm border-green-400"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">
                        {message.message_text || "Mensagem sem texto"}
                      </p>
                    </div>

                    <div
                      className={`mt-2 text-xs text-gray-500 ${message.sender_type === "agent" ? "text-right" : ""}`}
                    >
                      <span className="font-medium bg-gray-100 px-2 py-1 rounded">
                        {new Date(message.timestamp).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      {message.sender_type === "customer" && message.response_time_seconds && (
                        <>
                          <span className="mx-2">•</span>
                          <Badge
                            className={`${getResponseTimeBadgeColor(message.response_time_seconds)} text-white font-medium`}
                            variant="outline"
                          >
                            ⚡ Atendente respondeu em {formatResponseTime(message.response_time_seconds)}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
