"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DirectMessage } from "@/lib/types"

export function useSecureMessages(conversationId: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Fetch messages for the conversation
    const fetchMessages = async () => {
      try {
        // This query will only return messages the user has access to
        // thanks to the RLS policies we've implemented
        const { data, error } = await supabase
          .from("direct_messages")
          .select(`
            *,
            sender:sender_id(id, username, avatar_url, full_name),
            parent_message:parent_message_id(id, content, sender_id),
            attachments:file_attachments(*)
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (error) throw error

        setMessages(data || [])
      } catch (err) {
        console.error("Error fetching messages:", err)
        setError("Failed to load messages")
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
          // Fetch the complete message with relations
          const { data: newMessage } = await supabase
            .from("direct_messages")
            .select(`
              *,
              sender:sender_id(id, username, avatar_url, full_name),
              parent_message:parent_message_id(id, content, sender_id),
              attachments:file_attachments(*)
            `)
            .eq("id", payload.new.id)
            .single()

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage])
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [supabase, conversationId])

  // Function to send a message
  const sendMessage = async (content: string, attachments = [], parentMessageId?: string): Promise<boolean> => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to send messages")
        return false
      }

      // Create the message
      const { data: message, error: messageError } = await supabase
        .from("direct_messages")
        .insert({
          content,
          conversation_id: conversationId,
          sender_id: user.id,
          parent_message_id: parentMessageId || null,
          has_attachment: attachments.length > 0,
        })
        .select()
        .single()

      if (messageError) throw messageError

      // If there are attachments, add them
      if (attachments.length > 0 && message) {
        const attachmentPromises = attachments.map((attachment) =>
          supabase.from("file_attachments").insert({
            message_id: message.id,
            file_name: attachment.fileName,
            file_type: attachment.fileType,
            file_size: attachment.fileSize,
            file_url: attachment.fileUrl,
            thumbnail_url: attachment.thumbnailUrl,
          }),
        )

        await Promise.all(attachmentPromises)
      }

      // If this is a reply, increment the thread count on the parent message
      if (parentMessageId) {
        await supabase.rpc("increment_thread_count", {
          parent_id: parentMessageId,
        })
      }

      return true
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to send message")
      return false
    }
  }

  // Function to delete a message
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    try {
      // The RLS policy will ensure the user can only delete their own messages
      const { error } = await supabase.from("direct_messages").delete().eq("id", messageId)

      if (error) throw error

      return true
    } catch (err) {
      console.error("Error deleting message:", err)
      setError("Failed to delete message")
      return false
    }
  }

  // Function to edit a message
  const editMessage = async (messageId: string, content: string): Promise<boolean> => {
    try {
      // The RLS policy will ensure the user can only edit their own messages
      const { error } = await supabase
        .from("direct_messages")
        .update({
          content,
          is_edited: true,
        })
        .eq("id", messageId)

      if (error) throw error

      return true
    } catch (err) {
      console.error("Error editing message:", err)
      setError("Failed to edit message")
      return false
    }
  }

  // Function to mark messages as read
  const markAsRead = async (messageIds: string[]): Promise<boolean> => {
    if (messageIds.length === 0) return true

    try {
      const { error } = await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .in("id", messageIds)
        .eq("is_read", false)

      if (error) throw error

      return true
    } catch (err) {
      console.error("Error marking messages as read:", err)
      return false
    }
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    editMessage,
    markAsRead,
  }
}
