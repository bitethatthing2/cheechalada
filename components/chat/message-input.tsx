"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (content: string) => Promise<void>
}

export function MessageInput({ value, onChange, onSend }: MessageInputProps) {
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px" // Reset height
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px` // Limit max height
    }
  }, [value])

  const handleSendMessage = async () => {
    if (!value.trim() || isSending) return

    setIsSending(true)
    try {
      await onSend(value)
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px" // Reset height after sending
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="min-h-[40px] max-h-[120px] resize-none"
      />
      <Button
        onClick={handleSendMessage}
        disabled={!value.trim() || isSending}
        className="h-10 flex-shrink-0"
        size="icon"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  )
}
