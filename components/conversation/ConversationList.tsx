"use client"

import { useEffect, useState } from "react"
import type { DirectConversation, DirectParticipant, Profile } from "@/lib/db/types"
import { supabase } from "@/lib/db/supabase"
import { Loader2, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

interface ConversationWithParticipants extends DirectConversation {
  participants: (DirectParticipant & { profile: Profile })[]
  last_message?: {
    content: string
    created_at: string
  }
}

export default function ConversationList({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true)

        // Get conversations where the user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from("direct_participants")
          .select(`
            conversation_id,
            direct_conversations:conversation_id(*)
          `)
          .eq("user_id", userId)

        if (participantError) throw participantError

        // Get the conversation IDs
        const conversationIds = participantData.map((p) => p.conversation_id)

        // For each conversation, get the participants
        const enrichedConversations = await Promise.all(
          conversationIds.map(async (convId) => {
            // Get participants
            const { data: participants, error: participantsError } = await supabase
              .from("direct_participants")
              .select(`
                *,
                profile:profiles(*)
              `)
              .eq("conversation_id", convId)

            if (participantsError) throw participantsError

            // Get last message
            const { data: messages, error: messagesError } = await supabase
              .from("direct_messages")
              .select("content, created_at")
              .eq("conversation_id", convId)
              .order("created_at", { ascending: false })
              .limit(1)

            if (messagesError) throw messagesError

            // Find the conversation object
            const conversation = participantData.find((p) => p.conversation_id === convId)?.direct_conversations

            return {
              ...conversation,
              participants,
              last_message: messages?.[0],
            }
          }),
        )

        setConversations(enrichedConversations)
      } catch (error) {
        console.error("Error loading conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadConversations()
    }
  }, [userId])

  const handleConversationClick = (conversationId: string) => {
    router.push(`/conversations/${conversationId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-4">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        // Find other participants (not the current user)
        const otherParticipants = conversation.participants.filter((p) => p.user_id !== userId).map((p) => p.profile)

        const conversationName = otherParticipants.map((p) => p.username || p.full_name || "Unknown User").join(", ")

        return (
          <div
            key={conversation.id}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleConversationClick(conversation.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{conversationName}</h3>
                {conversation.last_message && (
                  <p className="text-sm text-gray-500 truncate">{conversation.last_message.content}</p>
                )}
              </div>
              {conversation.last_message && (
                <span className="text-xs text-gray-400">
                  {new Date(conversation.last_message.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
