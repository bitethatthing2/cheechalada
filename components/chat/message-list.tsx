"use client"

import type React from "react"

import type { Message } from "@/lib/types"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash, Check, X } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  onEditMessage: (id: string, content: string) => Promise<void>
  onDeleteMessage: (id: string) => Promise<void>
  loading: boolean
}

export function MessageList({ messages, currentUserId, onEditMessage, onDeleteMessage, loading }: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    if (editingMessageId && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
    }
  }, [editingMessageId])

  const handleStartEditing = (message: Message) => {
    setEditingMessageId(message.id)
    setEditedContent(message.content)
  }

  const handleCancelEditing = () => {
    setEditingMessageId(null)
    setEditedContent("")
  }

  const handleSaveEdit = async (id: string) => {
    if (editedContent.trim()) {
      await onEditMessage(id, editedContent)
      setEditingMessageId(null)
      setEditedContent("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit(id)
    } else if (e.key === "Escape") {
      handleCancelEditing()
    }
  }

  // Handle swipe to reveal actions on mobile
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const activeMessageId = useRef<string | null>(null)
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null)

  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    touchStartX.current = e.touches[0].clientX
    activeMessageId.current = messageId
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !activeMessageId.current) return

    const distance = touchStartX.current - touchEndX.current
    if (distance > 100) {
      // Swiped left
      setSwipedMessageId(activeMessageId.current)
    } else if (swipedMessageId === activeMessageId.current) {
      // Tapped on already swiped message
      setSwipedMessageId(null)
    }

    touchStartX.current = null
    touchEndX.current = null
    activeMessageId.current = null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.user_id === currentUserId
        const isEditing = editingMessageId === message.id
        const isSwipedOpen = swipedMessageId === message.id

        return (
          <div
            key={message.id}
            className={`flex items-start gap-3 group relative ${isSwipedOpen ? "bg-accent/50 rounded-md" : ""}`}
            onTouchStart={(e) => handleTouchStart(e, message.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
              <AvatarImage
                src={
                  message.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user_id}`
                }
                alt={message.profile?.username || "User"}
              />
              <AvatarFallback>{message.profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">
                  {message.profile?.full_name || message.profile?.username || "User"}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(message.created_at), "MMM d, h:mm a")}
                  {message.is_edited && <span className="ml-1 italic text-xs text-muted-foreground">(edited)</span>}
                </span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, message.id)}
                    className="min-h-[60px]"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(message.id)} disabled={!editedContent.trim()}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEditing}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
              )}
            </div>

            {/* Mobile swipe actions */}
            {isCurrentUser && !isEditing && isSwipedOpen && (
              <div className="absolute right-0 top-0 h-full flex items-center gap-1 px-1 bg-accent/50 rounded-r-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-500"
                  onClick={() => {
                    handleStartEditing(message)
                    setSwipedMessageId(null)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => {
                    onDeleteMessage(message.id)
                    setSwipedMessageId(null)
                  }}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            )}

            {/* Desktop dropdown */}
            {isCurrentUser && !isEditing && !isSwipedOpen && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStartEditing(message)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteMessage(message.id)}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
