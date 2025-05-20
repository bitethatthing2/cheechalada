"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DirectMessage } from "@/lib/types"

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const fetchMessages = async () => {
      try {
        // Get messages for this conversation
        const { data, error } = await supabase
          .from("direct_messages")
          .select("*, sender:profiles(*)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (error) throw error

        setMessages(data || [])

        // Mark messages as read
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from("direct_messages")
            .update({ is_read: true })
            .eq("conversation_id", conversationId)
            .neq("sender_id", user.id)
            .eq("is_read", false)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the sender profile for the new message
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single()

          const newMessage = {
            ...payload.new,
            sender: senderProfile,
          } as DirectMessage

          setMessages((prev) => [...prev, newMessage])

          // Mark message as read if it's not from the current user
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user && payload.new.sender_id !== user.id) {
            await supabase.from("direct_messages").update({ is_read: true }).eq("id", payload.new.id)
          }
        },
      )
      .subscribe()

    // Subscribe to read status changes
    const readStatusChannel = supabase
      .channel(`read_status:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update the read status of the message in the state
          if (payload.new && payload.new.is_read !== undefined) {
            setMessages((prevMessages) =>
              prevMessages.map((msg) => (msg.id === payload.new.id ? { ...msg, is_read: payload.new.is_read } : msg)),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(readStatusChannel)
    }
  }, [supabase, conversationId])

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!conversationId || !content.trim()) return false

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        is_read: false,
      })

      if (error) throw error

      // Update the conversation's updated_at timestamp
      await supabase
        .from("direct_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)

      return true
    } catch (error) {
      console.error("Error sending message:", error)
      return false
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
  }
}
