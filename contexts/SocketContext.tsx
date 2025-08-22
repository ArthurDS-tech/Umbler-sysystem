import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectedClients: ConnectedClient[]
  sendNotification: (notification: NotificationData) => void
  connectionStats: ConnectionStats | null
}

interface ConnectedClient {
  id: string
  userId: string
  username: string
  role: string
  ip: string
  connectedAt: Date
  lastSeen: Date
}

interface NotificationData {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  recipients?: string[] | 'all'
}

interface ConnectionStats {
  totalConnected: number
  admins: number
  clients: number
  uptime: number
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedClients, setConnectedClients] = useState<ConnectedClient[]>([])
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null)
  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      const socketInstance = io(process.env.NODE_ENV === 'production' 
        ? 'https://notificacoes-internas.vercel.app'
        : 'http://localhost:3000', {
        path: '/api/socket',
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
      })

      socketInstance.on('connect', () => {
        console.log('🟢 Conectado ao servidor')
        setIsConnected(true)
        toast.success('Conectado ao servidor!')
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('🔴 Desconectado do servidor:', reason)
        setIsConnected(false)
        if (reason === 'io server disconnect') {
          toast.error('Desconectado pelo servidor')
        } else {
          toast.error('Conexão perdida. Tentando reconectar...')
        }
      })

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Erro de conexão:', error)
        setIsConnected(false)
        toast.error('Erro de conexão')
      })

      // Eventos específicos
      socketInstance.on('connection-success', (data) => {
        console.log('✅ Conexão estabelecida:', data)
      })

      socketInstance.on('clients-updated', (data) => {
        setConnectedClients(data.clients)
        setConnectionStats(prev => ({
          ...prev!,
          totalConnected: data.total,
          clients: data.clients.length,
        }))
      })

      socketInstance.on('notification', (notification) => {
        console.log('📨 Notificação recebida:', notification)
        
        // Mostrar notificação visual
        const toastType = notification.type === 'error' ? 'error' :
                         notification.type === 'success' ? 'success' :
                         notification.type === 'warning' ? 'error' : 'success'
        
        toast[toastType](`${notification.sender}: ${notification.message}`, {
          duration: notification.priority === 'urgent' ? 10000 : 5000,
          icon: notification.priority === 'urgent' ? '🚨' : 
                notification.type === 'success' ? '✅' :
                notification.type === 'warning' ? '⚠️' :
                notification.type === 'error' ? '❌' : '📢',
        })

        // Notificação nativa do browser se permitido
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Notificação - ${notification.sender}`, {
            body: notification.message,
            icon: '/icon-192x192.png',
            tag: notification.id,
          })
        }
      })

      socketInstance.on('notification-sent', (data) => {
        toast.success(`Notificação enviada para ${data.recipientsCount} cliente(s)`)
      })

      socketInstance.on('stats', (stats) => {
        setConnectionStats(stats)
      })

      socketInstance.on('error', (error) => {
        console.error('❌ Erro do servidor:', error)
        toast.error(error.message)
      })

      setSocket(socketInstance)

      // Solicitar permissão para notificações
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            toast.success('Notificações do browser ativadas!')
          }
        })
      }

      // Ping periódico para manter conexão viva
      const pingInterval = setInterval(() => {
        if (socketInstance.connected) {
          socketInstance.emit('ping')
        }
      }, 30000)

      return () => {
        clearInterval(pingInterval)
        socketInstance.disconnect()
      }
    }
  }, [user, token])

  const sendNotification = (notification: NotificationData) => {
    if (socket && isConnected) {
      socket.emit('send-notification', notification)
    } else {
      toast.error('Não conectado ao servidor')
    }
  }

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      connectedClients,
      sendNotification,
      connectionStats,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider')
  }
  return context
}