"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useConversations } from "@/hooks/use-conversations"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { ConversationList } from "@/components/messaging/conversation-list"
import { OnlineUsers } from "@/components/messaging/online-users"
import { Separator } from "@/components/ui/separator"

export default function MessagingPage() {
  const router = useRouter()
  const { conversations, isLoading, currentUser } = useConversations()
  const { onlineUsers, isLoading: isLoadingOnlineUsers } = useOnlineStatus()

  // Redirect to the first conversation if available
  useEffect(() => {
    if (!isLoading && conversations.length > 0) {
      router.push(`/messaging/${conversations[0].id}`)
    }
  }, [isLoading, conversations, router])

  return (
    <div className="grid h-full md:grid-cols-[320px_1fr]">
      <div className="flex flex-col border-r h-full">
        <ConversationList conversations={conversations} isLoading={isLoading} />
        <Separator />
        <OnlineUsers users={onlineUsers} isLoading={isLoadingOnlineUsers} currentUserId={currentUser?.id} />
      </div>
      <div className="hidden md:flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <h3 className="font-medium">Select a conversation</h3>
          <p className="text-sm text-muted-foreground mt-1">Choose a conversation from the list or start a new one</p>
        </div>
      </div>
    </div>
  )
}
