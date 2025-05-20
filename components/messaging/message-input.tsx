"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EmojiPicker } from "@/components/messaging/emoji-picker"
import { FileUploadPreview } from "@/components/messaging/file-upload-preview"
import { QuotedMessage } from "@/components/messaging/quoted-message"
import { uploadFile, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@/lib/file-upload"
import { Send, PaperclipIcon, Smile } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { UploadResult } from "@/lib/file-upload"
import type { DirectMessage, Profile } from "@/lib/types"

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: UploadResult[]) => Promise<boolean>
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
  replyToMessage?: DirectMessage | null
  currentUser?: Profile | null
  onClearReply?: () => void
}

export function MessageInput({
  onSendMessage,
  onTyping,
  disabled = false,
  replyToMessage = null,
  currentUser = null,
  onClearReply,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [attachments, setAttachments] = useState<UploadResult[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastTypingRef = useRef<number>(0)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px" // Reset height
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px` // Limit max height
    }
  }, [message])

  // Focus textarea when replying to a message
  useEffect(() => {
    if (replyToMessage && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyToMessage])

  // Handle typing indicator
  useEffect(() => {
    if (!onTyping) return

    const now = Date.now()
    if (message && now - lastTypingRef.current > 2000) {
      onTyping(true)
      lastTypingRef.current = now
    }

    // If message is empty, set typing to false
    if (!message) {
      onTyping(false)
    }
  }, [message, onTyping])

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending || disabled) return

    setIsSending(true)
    try {
      const success = await onSendMessage(message, attachments)
      if (success) {
        setMessage("")
        setAttachments([])
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px" // Reset height after sending
        }
        // Set typing to false after sending
        if (onTyping) {
          onTyping(false)
        }
        // Clear reply if needed
        if (replyToMessage && onClearReply) {
          onClearReply()
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

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setIsEmojiPickerOpen(false)
    // Focus the textarea after selecting an emoji
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)

    // Check if any file exceeds the size limit
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        description: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      })
      return
    }

    // Check if any file has an unsupported type
    const unsupportedFiles = files.filter((file) => !ALLOWED_FILE_TYPES.includes(file.type))
    if (unsupportedFiles.length > 0) {
      toast({
        variant: "destructive",
        description: "One or more files have unsupported file types",
      })
      return
    }

    setIsUploading(true)
    try {
      const uploadPromises = files.map((file) => uploadFile(file))
      const results = await Promise.all(uploadPromises)

      // Filter out failed uploads
      const successfulUploads = results.filter((result) => result.success)
      const failedUploads = results.filter((result) => !result.success)

      if (failedUploads.length > 0) {
        toast({
          variant: "destructive",
          description: `Failed to upload ${failedUploads.length} file(s)`,
        })
      }

      if (successfulUploads.length > 0) {
        setAttachments((prev) => [...prev, ...successfulUploads])
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        variant: "destructive",
        description: "Failed to upload files",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClearReply = () => {
    if (onClearReply) {
      onClearReply()
    }
  }

  return (
    <div className="border-t p-4 bg-background">
      {/* Quoted message when replying */}
      {replyToMessage && currentUser && (
        <div className="mb-2">
          <QuotedMessage message={replyToMessage} currentUser={currentUser} onClear={handleClearReply} />
        </div>
      )}

      {/* File upload previews */}
      {attachments.length > 0 && (
        <div className="mb-2">
          <FileUploadPreview attachments={attachments} onRemove={removeAttachment} />
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          multiple
          accept={ALLOWED_FILE_TYPES.join(",")}
          disabled={disabled || isUploading}
        />

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <PaperclipIcon className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            replyToMessage
              ? "Type your reply..."
              : attachments.length > 0
                ? "Add a message or send attachment"
                : "Type a message..."
          }
          className="min-h-[40px] max-h-[120px] resize-none flex-1"
          disabled={disabled || isUploading}
        />

        <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 flex-shrink-0" disabled={disabled}>
              <Smile className="h-5 w-5" />
              <span className="sr-only">Add emoji</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" alignOffset={-40} sideOffset={10}>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleSendMessage}
          disabled={(message.trim() === "" && attachments.length === 0) || isSending || disabled || isUploading}
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
