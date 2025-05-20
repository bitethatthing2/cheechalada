"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/db/supabase"
import MessageThread from "@/components/conversation/MessageThread"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ConversationPage() {
  const { id: conversationId } = useParams()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversationTitle, setConversationTitle] = useState("")

  useEffect(() => {
    async function loadUserAndConversation() {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          throw new Error("Not authenticated")
        }

        setCurrentUserId(user.id)

        // Get conversation participants
        const { data: participants, error: participantsError } = await supabase
          .from("direct_participants")
          .select(`
            user_id,
            profiles:user_id(username, full_name)
          `)
          .eq("conversation_id", conversationId)

        if (participantsError) throw participantsError

        // Find other participants (not the current user)
        const otherParticipants = participants.filter((p) => p.user_id !== user.id).map((p) => p.profiles)

        // Create conversation title from other participants' names
        const title = otherParticipants.map((p) => p.username || p.full_name || "Unknown User").join(", ")

        setConversationTitle(title)
      } catch (error) {
        console.error("Error loading user and conversation:", error)
      } finally {
        setLoading(false)
      }
    }

    if (conversationId) {
      loadUserAndConversation()
    }
  }, [conversationId])

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
        <p>Please log in to view this conversation</p>
        <Button asChild className="mt-2">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/conversations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-medium">{conversationTitle}</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <MessageThread conversationId={conversationId as string} currentUserId={currentUserId} />
      </div>
    </div>
  )
}
