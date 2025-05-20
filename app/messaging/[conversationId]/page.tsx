"use client"
import { useConversations } from "@/hooks/use-conversations"
import { useMessages } from "@/hooks/use-messages"
import { ConversationHeader } from "@/components/messaging/conversation-header"
import { MessageThread } from "@/components/messaging/message-thread"
import { MessageInput } from "@/components/messaging/message-input"
import { ConversationList } from "@/components/messaging/conversation-list"
import { OnlineUsers } from "@/components/messaging/online-users"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  const { conversationId } = params
  const { conversations, isLoading: isLoadingConversations, currentUser } = useConversations()
  const { messages, isLoading: isLoadingMessages, sendMessage } = useMessages(conversationId)
  const { onlineUsers, isLoading: isLoadingOnlineUsers } = useOnlineStatus()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Find the current conversation
  const currentConversation = conversations.find((c) => c.id === conversationId)
  const otherParticipant = currentConversation?.other_participant

  return (
    <div className="grid h-full md:grid-cols-[320px_1fr]">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-10">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SheetTitle className="sr-only">Conversations</SheetTitle>
            <div className="flex flex-col h-full">
              <ConversationList
                conversations={conversations}
                isLoading={isLoadingConversations}
                currentUserId={currentUser?.id}
              />
              <Separator />
              <OnlineUsers users={onlineUsers} isLoading={isLoadingOnlineUsers} currentUserId={currentUser?.id} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex flex-col border-r h-full">
        <ConversationList
          conversations={conversations}
          isLoading={isLoadingConversations}
          currentUserId={currentUser?.id}
        />
        <Separator />
        <OnlineUsers users={onlineUsers} isLoading={isLoadingOnlineUsers} currentUserId={currentUser?.id} />
      </div>

      {/* Main conversation area */}
      <div className="flex flex-col h-full">
        <ConversationHeader participant={otherParticipant} isLoading={isLoadingConversations} />

        <div className="flex-1 overflow-y-auto">
          <MessageThread messages={messages} currentUser={currentUser} isLoading={isLoadingMessages} />
        </div>

        <MessageInput onSendMessage={sendMessage} disabled={isLoadingMessages || !conversationId} />
      </div>
    </div>
  )
}
