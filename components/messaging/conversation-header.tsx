"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { KeyboardShortcutsHelp } from "@/components/messaging/keyboard-shortcuts-help"
import { MoreHorizontal, Phone, Video, Search } from "lucide-react"
import type { Profile } from "@/lib/types"

interface ConversationHeaderProps {
  participant: Profile | null | undefined
  isLoading: boolean
  isTyping?: boolean
  onSearchClick?: () => void
}

export function ConversationHeader({
  participant,
  isLoading,
  isTyping = false,
  onSearchClick,
}: ConversationHeaderProps) {
  if (isLoading) {
    return (
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted"></div>
          <div className="h-5 w-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">Select a conversation</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={participant.avatar_url || undefined} alt={participant.username || "User"} />
          <AvatarFallback>{participant.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{participant.full_name || participant.username}</h3>
          <p className="text-xs text-green-500">{isTyping ? "Typing..." : "Online"}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onSearchClick && (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onSearchClick}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search messages</span>
          </Button>
        )}
        <KeyboardShortcutsHelp />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Phone className="h-5 w-5" />
          <span className="sr-only">Call</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Video className="h-5 w-5" />
          <span className="sr-only">Video call</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </div>
    </div>
  )
}
