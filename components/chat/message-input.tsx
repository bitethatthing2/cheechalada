"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "60px" // Reset height
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px` // Limit max height
    }
  }, [message])

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(message)
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.style.height = "60px" // Reset height after sending
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="min-h-[60px] resize-none"
      />
      <Button
        onClick={handleSendMessage}
        disabled={!message.trim() || isSending}
        className="h-[60px] flex-shrink-0"
        size="icon"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  )
}
