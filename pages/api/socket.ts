import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import { kv } from '@vercel/kv'

interface ExtendedNextApiResponse extends NextApiResponse {
  socket: any
}

interface ConnectedClient {
  id: string
  userId: string
  username: string
  role: string
  ip: string
  userAgent: string
  connectedAt: Date
  lastSeen: Date
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const connectedClients = new Map<string, ConnectedClient>()

export default async function handler(
  req: NextApiRequest,
  res: ExtendedNextApiResponse
) {
  if (!res.socket.server.io) {
    console.log('🚀 Iniciando servidor Socket.IO...')
    
    const httpServer: HTTPServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://notificacoes-internas.vercel.app']
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    // Middleware de autenticação
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Token não fornecido'))
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        socket.userId = decoded.userId
        socket.username = decoded.username
        socket.role = decoded.role
        
        next()
      } catch (error) {
        next(new Error('Token inválido'))
      }
    })

    io.on('connection', async (socket) => {
      const clientInfo: ConnectedClient = {
        id: socket.id,
        userId: socket.userId,
        username: socket.username,
        role: socket.role,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'] || '',
        connectedAt: new Date(),
        lastSeen: new Date(),
      }

      connectedClients.set(socket.id, clientInfo)
      
      console.log(`👤 Cliente conectado: ${clientInfo.username} (${socket.id})`)

      // Entrar na sala baseada no role
      if (clientInfo.role === 'admin') {
        socket.join('admins')
      } else {
        socket.join('clients')
      }

      // Enviar lista de clientes para admins
      io.to('admins').emit('clients-updated', {
        clients: Array.from(connectedClients.values()).filter(c => c.role !== 'admin'),
        total: connectedClients.size,
      })

      // Enviar estatísticas para o cliente
      socket.emit('connection-success', {
        clientId: socket.id,
        connectedAt: clientInfo.connectedAt,
        totalClients: connectedClients.size,
      })

      // Salvar conexão no KV (para persistência)
      try {
        await kv.set(`client:${socket.id}`, clientInfo)
        await kv.expire(`client:${socket.id}`, 3600) // 1 hora
      } catch (error) {
        console.error('Erro ao salvar no KV:', error)
      }

      // Handler para envio de notificações
      socket.on('send-notification', async (data) => {
        if (clientInfo.role !== 'admin') {
          socket.emit('error', { message: 'Acesso negado' })
          return
        }

        const notification = {
          id: Date.now().toString(),
          message: data.message,
          type: data.type || 'info',
          priority: data.priority || 'normal',
          sender: clientInfo.username,
          timestamp: new Date(),
          recipients: data.recipients || 'all',
        }

        // Validar mensagem
        if (!notification.message || notification.message.trim().length === 0) {
          socket.emit('error', { message: 'Mensagem não pode estar vazia' })
          return
        }

        if (notification.message.length > 1000) {
          socket.emit('error', { message: 'Mensagem muito longa (máximo 1000 caracteres)' })
          return
        }

        // Salvar notificação no histórico
        try {
          await kv.lpush('notifications:history', notification)
          await kv.ltrim('notifications:history', 0, 999) // Manter últimas 1000
        } catch (error) {
          console.error('Erro ao salvar histórico:', error)
        }

        // Enviar para clientes
        if (notification.recipients === 'all') {
          io.to('clients').emit('notification', notification)
        } else if (Array.isArray(notification.recipients)) {
          notification.recipients.forEach(clientId => {
            io.to(clientId).emit('notification', notification)
          })
        }

        // Confirmar envio para o admin
        socket.emit('notification-sent', {
          ...notification,
          recipientsCount: notification.recipients === 'all' 
            ? Array.from(connectedClients.values()).filter(c => c.role !== 'admin').length
            : Array.isArray(notification.recipients) ? notification.recipients.length : 1
        })

        console.log(`📤 Notificação enviada por ${clientInfo.username}: ${notification.message}`)
      })

      // Handler para ping/pong (keep alive)
      socket.on('ping', () => {
        clientInfo.lastSeen = new Date()
        socket.emit('pong', { timestamp: clientInfo.lastSeen })
      })

      // Handler para obter histórico
      socket.on('get-history', async () => {
        if (clientInfo.role !== 'admin') {
          socket.emit('error', { message: 'Acesso negado' })
          return
        }

        try {
          const history = await kv.lrange('notifications:history', 0, 49) // Últimas 50
          socket.emit('history', history)
        } catch (error) {
          console.error('Erro ao buscar histórico:', error)
          socket.emit('error', { message: 'Erro ao buscar histórico' })
        }
      })

      // Handler para obter estatísticas
      socket.on('get-stats', async () => {
        if (clientInfo.role !== 'admin') {
          socket.emit('error', { message: 'Acesso negado' })
          return
        }

        const stats = {
          totalConnected: connectedClients.size,
          admins: Array.from(connectedClients.values()).filter(c => c.role === 'admin').length,
          clients: Array.from(connectedClients.values()).filter(c => c.role !== 'admin').length,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        }

        socket.emit('stats', stats)
      })

      // Handler para desconexão
      socket.on('disconnect', async (reason) => {
        console.log(`👋 Cliente desconectado: ${clientInfo.username} (${reason})`)
        
        connectedClients.delete(socket.id)
        
        // Remover do KV
        try {
          await kv.del(`client:${socket.id}`)
        } catch (error) {
          console.error('Erro ao remover do KV:', error)
        }

        // Atualizar lista para admins
        io.to('admins').emit('clients-updated', {
          clients: Array.from(connectedClients.values()).filter(c => c.role !== 'admin'),
          total: connectedClients.size,
        })
      })

      // Handler para erros
      socket.on('error', (error) => {
        console.error(`❌ Erro no socket ${socket.id}:`, error)
      })
    })

    res.socket.server.io = io
    console.log('✅ Servidor Socket.IO configurado')
  } else {
    console.log('⚡ Servidor Socket.IO já está rodando')
  }

  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}