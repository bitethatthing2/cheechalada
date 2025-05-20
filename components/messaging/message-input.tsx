"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, PaperclipIcon, Smile } from "lucide-react"

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<boolean>
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px" // Reset height
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px` // Limit max height
    }
  }, [message])

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || disabled) return

    setIsSending(true)
    try {
      const success = await onSendMessage(message)
      if (success) {
        setMessage("")
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px" // Reset height after sending
        }
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
    <div className="border-t p-4 bg-background">
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 flex-shrink-0" disabled={disabled}>
          <PaperclipIcon className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] resize-none flex-1"
          disabled={disabled}
        />

        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 flex-shrink-0" disabled={disabled}>
          <Smile className="h-5 w-5" />
          <span className="sr-only">Add emoji</span>
        </Button>

        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending || disabled}
          size="icon"
          className="rounded-full h-9 w-9 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}
