"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DirectConversation, Profile } from "@/lib/types"

export function useConversations() {
  const [conversations, setConversations] = useState<DirectConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setCurrentUser(profile)
        return profile
      } catch (error) {
        console.error("Error fetching current user:", error)
        return null
      }
    }

    const fetchConversations = async () => {
      try {
        setIsLoading(true)
        const user = await fetchCurrentUser()
        if (!user) return

        // Get all conversations the user is part of
        const { data: participantData, error: participantError } = await supabase
          .from("direct_participants")
          .select("conversation_id")
          .eq("user_id", user.id)

        if (participantError) throw participantError

        if (!participantData || participantData.length === 0) {
          setConversations([])
          return
        }

        const conversationIds = participantData.map((p) => p.conversation_id)

        // Get all conversations with their last message
        const { data: conversationsData, error: conversationsError } = await supabase
          .from("direct_conversations")
          .select("*")
          .in("id", conversationIds)
          .order("updated_at", { ascending: false })

        if (conversationsError) throw conversationsError

        // For each conversation, get the other participant and last message
        const conversationsWithParticipants = await Promise.all(
          conversationsData.map(async (conversation) => {
            // Get all participants
            const { data: participants, error: participantsError } = await supabase
              .from("direct_participants")
              .select("*, profile:profiles(*)")
              .eq("conversation_id", conversation.id)

            if (participantsError) throw participantsError

            // Find the other participant (not the current user)
            const otherParticipant = participants?.find((p) => p.user_id !== user.id)?.profile || null

            // Get the last message
            const { data: lastMessages, error: lastMessageError } = await supabase
              .from("direct_messages")
              .select("*")
              .eq("conversation_id", conversation.id)
              .order("created_at", { ascending: false })
              .limit(1)

            if (lastMessageError && lastMessageError.code !== "PGRST116") {
              // PGRST116 is the error code for no rows returned
              throw lastMessageError
            }

            const lastMessage = lastMessages && lastMessages.length > 0 ? lastMessages[0] : null

            // Count unread messages
            const { count: unreadCount, error: unreadError } = await supabase
              .from("direct_messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conversation.id)
              .eq("is_read", false)
              .neq("sender_id", user.id)

            if (unreadError) throw unreadError

            return {
              ...conversation,
              other_participant: otherParticipant,
              last_message: lastMessage,
              unread_count: unreadCount || 0,
            }
          }),
        )

        setConversations(conversationsWithParticipants)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()

    // Subscribe to new conversations
    const conversationsChannel = supabase
      .channel("direct_conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_conversations",
        },
        () => {
          fetchConversations()
        },
      )
      .subscribe()

    // Subscribe to new messages (which might update conversation timestamps)
    const messagesChannel = supabase
      .channel("direct_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          fetchConversations()
        },
      )
      .subscribe()

    // Subscribe to read status changes
    const readStatusChannel = supabase
      .channel("read_status_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: "is_read=eq.true",
        },
        () => {
          fetchConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(readStatusChannel)
    }
  }, [supabase])

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    try {
      if (!currentUser) return null

      // Check if conversation already exists
      const { data: existingParticipants } = await supabase
        .from("direct_participants")
        .select("conversation_id")
        .eq("user_id", currentUser.id)

      if (existingParticipants && existingParticipants.length > 0) {
        const conversationIds = existingParticipants.map((p) => p.conversation_id)

        const { data: otherParticipants } = await supabase
          .from("direct_participants")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", conversationIds)

        if (otherParticipants && otherParticipants.length > 0) {
          // Conversation already exists
          return otherParticipants[0].conversation_id
        }
      }

      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from("direct_conversations")
        .insert({})
        .select()
        .single()

      if (conversationError) throw conversationError

      // Add participants
      const { error: participantsError } = await supabase.from("direct_participants").insert([
        { conversation_id: newConversation.id, user_id: currentUser.id },
        { conversation_id: newConversation.id, user_id: otherUserId },
      ])

      if (participantsError) throw participantsError

      return newConversation.id
    } catch (error) {
      console.error("Error starting conversation:", error)
      return null
    }
  }

  return {
    conversations,
    isLoading,
    currentUser,
    startConversation,
  }
}
