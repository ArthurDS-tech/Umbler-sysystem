"use client"

import { Badge } from "@/components/ui/badge"
import { WifiOff, Clock, RefreshCw } from "lucide-react"

interface RealtimeIndicatorProps {
  isConnected: boolean
  lastUpdate: Date | null
  error?: string | null
}

export function RealtimeIndicator({ isConnected, lastUpdate, error }: RealtimeIndicatorProps) {
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "Nunca"
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return `${diff}s atrás`
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`
    return date.toLocaleTimeString("pt-BR")
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
        {isConnected ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Atualizando</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Erro</span>
          </>
        )}
      </Badge>

      {lastUpdate && (
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Atualizado {formatLastUpdate(lastUpdate)}</span>
        </div>
      )}

      {error && (
        <span className="text-red-500 text-xs max-w-xs truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  )
}
