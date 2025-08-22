import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useNotification } from '@/contexts/NotificationContext'
import Layout from '@/components/Layout'
import Dashboard from '@/components/Dashboard'
import LoginForm from '@/components/LoginForm'
import LoadingScreen from '@/components/LoadingScreen'

export default function Home() {
  const { user, loading } = useAuth()
  const { isConnected } = useSocket()
  const router = useRouter()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}