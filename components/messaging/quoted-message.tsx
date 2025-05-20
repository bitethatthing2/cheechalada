"use client"

import type { DirectMessage, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuotedMessageProps {
  message: DirectMessage
  currentUser: Profile | null
  onClear: () => void
  className?: string
}

export function QuotedMessage({ message, currentUser, onClear, className }: QuotedMessageProps) {
  const isCurrentUser = message.sender_id === currentUser?.id
  const senderName = isCurrentUser ? "You" : message.sender?.full_name || message.sender?.username || "User"

  return (
    <div className={cn("p-2 rounded-md bg-muted/50 border-l-4 border-primary/50 relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 absolute top-1 right-1 text-muted-foreground"
        onClick={onClear}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Clear quoted message</span>
      </Button>
      <div className="text-xs font-medium text-primary/80 mb-1">Replying to {senderName}</div>
      <div className="text-sm text-muted-foreground line-clamp-2">{message.content}</div>
    </div>
  )
}
