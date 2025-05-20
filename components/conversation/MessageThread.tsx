"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { sendMessage, deleteMessage, updateMessage } from "@/lib/db/supabase"
import type { DirectMessage, Profile } from "@/lib/db/types"
import { supabase } from "@/lib/db/supabase"
import { Loader2, Send, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MessageWithSender extends DirectMessage {
  sender: Profile
}

export default function MessageThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string
  currentUserId: string
}) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true)

        // Get messages for this conversation
        const { data, error } = await supabase
          .from("direct_messages")
          .select(`
            *,
            sender:profiles!sender_id(*)
          `)
          .eq("conversation_id", conversationId)
          .eq("is_deleted", false) // Only get non-deleted messages
          .order("created_at", { ascending: true })

        if (error) throw error

        setMessages(data || [])
      } catch (error) {
        console.error("Error loading messages:", error)
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // When a new message is inserted, fetch the sender details
          const { data: senderData, error: senderError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single()

          if (senderError) {
            console.error("Error fetching sender:", senderError)
            return
          }

          // Add the new message to the state
          setMessages((prev) => [
            ...prev,
            {
              ...(payload.new as DirectMessage),
              sender: senderData,
            },
          ])
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
        async (payload) => {
          // Handle updates (including soft deletes)
          if (payload.new.is_deleted) {
            // If message was soft-deleted, remove it from the UI
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.new.id))
          } else {
            // If message was updated, update it in the UI
            setMessages((prev) => prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    try {
      setSending(true)

      await sendMessage({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage,
        is_read: false,
        has_attachment: false,
        is_edited: false,
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      // UI update will happen via the real-time subscription
      toast({
        title: "Success",
        description: "Message deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = (message: MessageWithSender) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return

    try {
      await updateMessage(messageId, {
        content: editingContent,
        is_edited: true,
      })

      setEditingMessageId(null)
      setEditingContent("")
      toast({
        title: "Success",
        description: "Message updated successfully.",
      })
    } catch (error) {
      console.error("Error updating message:", error)
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.sender_id === currentUserId
          const isEditing = editingMessageId === message.id

          return (
            <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-start gap-2 max-w-[80%]`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.avatar_url || ""} />
                  <AvatarFallback>
                    {(message.sender.username || message.sender.full_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="relative group">
                  {isEditing ? (
                    <div className="p-2 border rounded-lg bg-background min-w-[200px]">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="resize-none mb-2"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(message.id)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`p-3 rounded-lg ${
                          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {message.is_edited && " (edited)"}
                      </div>

                      {/* Message actions for current user's messages */}
                      {isCurrentUser && (
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                  <circle cx="5" cy="12" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMessage(message)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="resize-none"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
