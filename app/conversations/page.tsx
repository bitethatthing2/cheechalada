"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/db/supabase"
import ConversationList from "@/components/conversation/ConversationList"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ConversationsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="text-center p-4">
        <p>Please log in to view your conversations</p>
        <Button asChild className="mt-2">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <Button asChild>
          <Link href="/conversations/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Conversation
          </Link>
        </Button>
      </div>

      <ConversationList userId={currentUserId} />
    </div>
  )
}
