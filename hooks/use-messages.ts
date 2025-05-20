"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DirectMessage, FileAttachment } from "@/lib/types"
import type { UploadResult } from "@/lib/file-upload"

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingMessage, setIsDeletingMessage] = useState<string | null>(null)
  const [isEditingMessage, setIsEditingMessage] = useState<string | null>(null)
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

        // For each message, fetch its attachments if it has any
        const messagesWithAttachments = await Promise.all(
          data.map(async (message) => {
            if (message.has_attachment) {
              const { data: attachments, error: attachmentsError } = await supabase
                .from("file_attachments")
                .select("*")
                .eq("message_id", message.id)
                .order("created_at", { ascending: true })

              if (attachmentsError) throw attachmentsError

              return { ...message, attachments }
            }
            return message
          }),
        )

        setMessages(messagesWithAttachments || [])

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

          let newMessage = {
            ...payload.new,
            sender: senderProfile,
          } as DirectMessage

          // If the message has attachments, fetch them
          if (payload.new.has_attachment) {
            const { data: attachments } = await supabase
              .from("file_attachments")
              .select("*")
              .eq("message_id", payload.new.id)
              .order("created_at", { ascending: true })

            newMessage = { ...newMessage, attachments }
          }

          // If the message is a reply to another message, fetch the parent message
          if (payload.new.parent_message_id) {
            const { data: parentMessage } = await supabase
              .from("direct_messages")
              .select("*, sender:profiles(*)")
              .eq("id", payload.new.parent_message_id)
              .single()

            if (parentMessage) {
              newMessage = { ...newMessage, parent_message: parentMessage }
            }
          }

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

    // Subscribe to message deletions
    const messageDeletionsChannel = supabase
      .channel(`message_deletions:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Remove the deleted message from state
          setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== payload.old.id))
        },
      )
      .subscribe()

    // Subscribe to message updates (thread count changes, edits)
    const messageUpdatesChannel = supabase
      .channel(`message_updates:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update the message in state
          setMessages((prevMessages) =>
            prevMessages.map((msg) => {
              if (msg.id === payload.new.id) {
                return { ...msg, ...payload.new }
              }
              return msg
            }),
          )
        },
      )
      .subscribe()

    // Subscribe to file attachment changes
    const attachmentsChannel = supabase
      .channel(`attachments:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "file_attachments",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Find the message this attachment belongs to
            setMessages((prevMessages) =>
              prevMessages.map((msg) => {
                if (msg.id === payload.new.message_id) {
                  const attachments = msg.attachments || []
                  return {
                    ...msg,
                    attachments: [...attachments, payload.new as FileAttachment],
                  }
                }
                return msg
              }),
            )
          } else if (payload.eventType === "DELETE") {
            // Remove the deleted attachment
            setMessages((prevMessages) =>
              prevMessages.map((msg) => {
                if (msg.id === payload.old.message_id && msg.attachments) {
                  return {
                    ...msg,
                    attachments: msg.attachments.filter((att) => att.id !== payload.old.id),
                  }
                }
                return msg
              }),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(messageDeletionsChannel)
      supabase.removeChannel(messageUpdatesChannel)
      supabase.removeChannel(attachmentsChannel)
    }
  }, [supabase, conversationId])

  const sendMessage = async (
    content: string,
    attachments: UploadResult[] = [],
    parentMessageId?: string,
  ): Promise<boolean> => {
    if (!conversationId || (content.trim() === "" && attachments.length === 0)) return false

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      // Insert the message
      const { data: messageData, error: messageError } = await supabase
        .from("direct_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          is_read: false,
          has_attachment: attachments.length > 0,
          parent_message_id: parentMessageId || null,
        })
        .select()
        .single()

      if (messageError) throw messageError

      // If there are attachments, insert them
      if (attachments.length > 0 && messageData) {
        const attachmentRecords = attachments.map((attachment) => ({
          message_id: messageData.id,
          file_name: attachment.fileName,
          file_size: attachment.fileSize,
          file_type: attachment.fileType,
          file_url: attachment.fileUrl!,
          thumbnail_url: attachment.thumbnailUrl,
        }))

        const { error: attachmentsError } = await supabase.from("file_attachments").insert(attachmentRecords)

        if (attachmentsError) throw attachmentsError
      }

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

  const editMessage = async (messageId: string, newContent: string): Promise<boolean> => {
    if (!messageId || !newContent.trim()) return false

    try {
      setIsEditingMessage(messageId)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      // First check if the message belongs to the current user
      const { data: message, error: fetchError } = await supabase
        .from("direct_messages")
        .select("sender_id, has_attachment")
        .eq("id", messageId)
        .single()

      if (fetchError) throw fetchError

      // Only allow editing if the user is the sender
      if (message.sender_id !== user.id) {
        throw new Error("You can only edit your own messages")
      }

      // Don't allow editing messages with attachments
      if (message.has_attachment) {
        throw new Error("Messages with attachments cannot be edited")
      }

      // Update the message
      const { error: updateError } = await supabase
        .from("direct_messages")
        .update({
          content: newContent.trim(),
          is_edited: true,
        })
        .eq("id", messageId)

      if (updateError) throw updateError

      // Optimistically update the UI
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, content: newContent.trim(), is_edited: true }
          }
          return msg
        }),
      )

      return true
    } catch (error) {
      console.error("Error editing message:", error)
      return false
    } finally {
      setIsEditingMessage(null)
    }
  }

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!messageId) return false

    try {
      setIsDeletingMessage(messageId)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      // First check if the message belongs to the current user
      const { data: message, error: fetchError } = await supabase
        .from("direct_messages")
        .select("sender_id")
        .eq("id", messageId)
        .single()

      if (fetchError) throw fetchError

      // Only allow deletion if the user is the sender
      if (message.sender_id !== user.id) {
        throw new Error("You can only delete your own messages")
      }

      // Delete the message
      const { error: deleteError } = await supabase.from("direct_messages").delete().eq("id", messageId)

      if (deleteError) throw deleteError

      // Optimistically update the UI
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId))

      return true
    } catch (error) {
      console.error("Error deleting message:", error)
      return false
    } finally {
      setIsDeletingMessage(null)
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    isDeletingMessage,
    isEditingMessage,
  }
}
