import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ConversationDetails } from "@/components/conversation-details"

interface ConversationPageProps {
  params: {
    conversationId: string
  }
}

export default function ConversationPage({ params }: ConversationPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="outline" className="mb-4 bg-transparent">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Detalhes da Conversa</h1>
          <p className="text-gray-600">ID: {params.conversationId}</p>
        </div>

        {/* Detalhes da Conversa */}
        <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-96" />}>
          <ConversationDetails conversationId={params.conversationId} />
        </Suspense>
      </div>
    </div>
  )
}
