"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMessageReactions } from "@/hooks/use-message-reactions"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

interface MessageReactionsProps {
  messageId: string
  currentUserId?: string
}

// Common emoji reactions
const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "👏", "🎉", "🔥"]

export function MessageReactions({ messageId, currentUserId }: MessageReactionsProps) {
  const { groupedReactions, addReaction } = useMessageReactions(messageId)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

  const handleAddReaction = async (emoji: string) => {
    await addReaction(emoji)
    setIsEmojiPickerOpen(false)
  }

  // Check if the current user has reacted with a specific emoji
  const hasUserReacted = (users: Profile[]) => {
    return users.some((user) => user.id === currentUserId)
  }

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, { count, users }]) => (
        <TooltipProvider key={emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-6 px-2 py-1 text-xs rounded-full", hasUserReacted(users) && "bg-primary/10")}
                onClick={() => addReaction(emoji)}
              >
                <span className="mr-1">{emoji}</span>
                <span>{count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center gap-1 py-0.5">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.username || "User"} />
                      <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span>{user.full_name || user.username}</span>
                  </div>
                ))}
                {users.length > 10 && <div className="text-center mt-1">+{users.length - 10} more</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-foreground"
          >
            <span className="text-sm">+</span>
            <span className="sr-only">Add reaction</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {commonEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleAddReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
