import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { kv } from '@vercel/kv'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Usuários padrão (em produção, use banco de dados)
const defaultUsers = [
  {
    id: 'admin-1',
    username: 'admin',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.LkNRw.7MS', // "admin123"
    role: 'admin',
    name: 'Administrador',
    email: 'admin@empresa.com',
  },
  {
    id: 'user-1', 
    username: 'cliente',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.LkNRw.7MS', // "cliente123"
    role: 'client',
    name: 'Cliente Teste',
    email: 'cliente@empresa.com',
  },
]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Username e password são obrigatórios' })
    }

    // Buscar usuário (primeiro no KV, depois nos padrões)
    let user = null
    
    try {
      const kvUser = await kv.get(`user:${username}`)
      if (kvUser) {
        user = kvUser
      }
    } catch (error) {
      console.log('KV não disponível, usando usuários padrão')
    }

    if (!user) {
      user = defaultUsers.find(u => u.username === username)
    }

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Salvar sessão no KV
    try {
      await kv.set(`session:${user.id}`, {
        userId: user.id,
        username: user.username,
        role: user.role,
        loginAt: new Date(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      })
      await kv.expire(`session:${user.id}`, 86400) // 24 horas
    } catch (error) {
      console.error('Erro ao salvar sessão no KV:', error)
    }

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    })

  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}