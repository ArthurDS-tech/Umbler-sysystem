import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  role: 'admin' | 'client'
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar token salvo no localStorage
    const savedToken = localStorage.getItem('auth-token')
    const savedUser = localStorage.getItem('auth-user')

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error)
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
      }
    }

    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setUser(data.user)
        
        // Salvar no localStorage
        localStorage.setItem('auth-token', data.token)
        localStorage.setItem('auth-user', JSON.stringify(data.user))
        
        toast.success(`Bem-vindo, ${data.user.name}!`)
        return true
      } else {
        toast.error(data.message || 'Erro no login')
        return false
      }
    } catch (error) {
      console.error('Erro no login:', error)
      toast.error('Erro de conexão')
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-user')
    toast.success('Logout realizado com sucesso')
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}