"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useConversations } from "@/hooks/use-conversations"
import type { Profile } from "@/lib/types"

interface OnlineUsersProps {
  users: Profile[]
  isLoading: boolean
  currentUserId?: string
}

export function OnlineUsers({ users, isLoading, currentUserId }: OnlineUsersProps) {
  const router = useRouter()
  const { startConversation } = useConversations()
  const [isStartingConversation, setIsStartingConversation] = useState<string | null>(null)

  // Filter out current user
  const filteredUsers = users.filter((user) => user.id !== currentUserId)

  const handleStartConversation = async (userId: string) => {
    setIsStartingConversation(userId)
    try {
      const conversationId = await startConversation(userId)
      if (conversationId) {
        router.push(`/messaging/${conversationId}`)
      }
    } finally {
      setIsStartingConversation(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-medium mb-3">Online Now</h3>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="p-4">
        <h3 className="font-medium mb-2">Online Now</h3>
        <p className="text-sm text-muted-foreground">No users online at the moment</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="font-medium mb-3">Online Now</h3>
      <ScrollArea className="max-h-[120px]">
        <div className="flex flex-wrap gap-3">
          <TooltipProvider>
            {filteredUsers.map((user) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full p-0 relative"
                    onClick={() => handleStartConversation(user.id)}
                    disabled={isStartingConversation === user.id}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.username || "User"} />
                      <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.full_name || user.username}</p>
                  <p className="text-xs text-muted-foreground">Click to message</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </ScrollArea>
    </div>
  )
}
