"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatResponseTime, getResponseTimeBadgeColor } from "@/lib/utils"
import { Eye, Clock, MessageSquare, Activity } from "lucide-react"
import Link from "next/link"
import { useRealtimeMetrics } from "@/hooks/use-realtime-metrics"
import { RealtimeIndicator } from "./realtime-indicator"

export function RealtimeConversationsList() {
  const { metrics: conversations, isConnected, lastUpdate, error } = useRealtimeMetrics()

  if (conversations.length === 0 && isConnected) {
    return (
      <div className="space-y-4">
        <RealtimeIndicator isConnected={isConnected} lastUpdate={lastUpdate} error={error} />
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aguardando conversas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Tempo Real
        </h3>
        <RealtimeIndicator isConnected={isConnected} lastUpdate={lastUpdate} error={error} />
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.conversation_id}
            className={`border rounded-lg p-4 transition-all duration-300 ${
              isConnected ? "hover:bg-gray-50 hover:shadow-sm" : "opacity-75"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {conversation.customer_name || `Conversa ${conversation.conversation_id.slice(-8)}`}
                  {isConnected && (
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                      title="Atualização em tempo real"
                    />
                  )}
                </h4>
                <p className="text-xs text-gray-500">Agente: {conversation.agent_name || "Não atribuído"}</p>
              </div>
              <Badge variant={conversation.status === "active" ? "default" : "secondary"}>{conversation.status}</Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
              <span>{conversation.total_messages} mensagens</span>
              <span>Atualizado: {new Date(conversation.updated_at).toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span className="text-sm">
                  Tempo médio: {formatResponseTime(Math.round(conversation.avg_response_time || 0))}
                </span>
                <Badge className={getResponseTimeBadgeColor(conversation.avg_response_time || 0)} variant="secondary">
                  {conversation.avg_response_time <= 30
                    ? "Rápido"
                    : conversation.avg_response_time <= 120
                      ? "Normal"
                      : conversation.avg_response_time <= 300
                        ? "Lento"
                        : "Muito Lento"}
                </Badge>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/conversation/${conversation.conversation_id}`}>
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
