"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, X } from "lucide-react"

interface MessageEditorProps {
  messageId: string
  initialContent: string
  onSave: (messageId: string, newContent: string) => Promise<boolean>
  onCancel: () => void
  isLoading?: boolean
}

export function MessageEditor({ messageId, initialContent, onSave, onCancel, isLoading = false }: MessageEditorProps) {
  const [content, setContent] = useState(initialContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasChanges = content !== initialContent

  // Focus the textarea when the editor opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      // Place cursor at the end of the text
      textareaRef.current.selectionStart = textareaRef.current.value.length
      textareaRef.current.selectionEnd = textareaRef.current.value.length
    }
  }, [])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto" // Reset height
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px` // Limit max height
    }
  }, [content])

  const handleSave = async () => {
    if (content.trim() === "") return
    const success = await onSave(messageId, content)
    if (success) {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[40px] max-h-[120px] resize-none"
        disabled={isLoading}
        placeholder="Edit your message..."
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading} className="h-8 px-2 rounded-md">
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || content.trim() === "" || isLoading}
          className="h-8 px-2 rounded-md"
        >
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">Press Esc to cancel, Enter to save</div>
    </div>
  )
}
