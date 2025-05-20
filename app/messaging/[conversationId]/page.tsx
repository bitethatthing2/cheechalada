"use client"

import { useConversations } from "@/hooks/use-conversations"
import { useMessages } from "@/hooks/use-messages"
import { useTypingIndicator } from "@/hooks/use-typing-indicator"
import { ConversationHeader } from "@/components/messaging/conversation-header"
import { MessageThread } from "@/components/messaging/message-thread"
import { MessageInput } from "@/components/messaging/message-input"
import { TypingIndicator } from "@/components/messaging/typing-indicator"
import { MessageSearch } from "@/components/messaging/message-search"
import { KeyboardShortcuts } from "@/components/messaging/keyboard-shortcuts"
import { ConversationList } from "@/components/messaging/conversation-list"
import { OnlineUsers } from "@/components/messaging/online-users"
import { ThreadView } from "@/components/messaging/thread-view"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState, useRef } from "react"
import type { DirectMessage } from "@/lib/types"

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  const { conversationId } = params
  const { conversations, isLoading: isLoadingConversations, currentUser } = useConversations()
  const {
    messages,
    isLoading: isLoadingMessages,
    sendMessage,
    deleteMessage,
    editMessage,
    isDeletingMessage,
    isEditingMessage,
  } = useMessages(conversationId)
  const { typingUsers, setTypingStatus } = useTypingIndicator(conversationId)
  const { onlineUsers, isLoading: isLoadingOnlineUsers } = useOnlineStatus()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<DirectMessage | null>(null)
  const [activeThread, setActiveThread] = useState<DirectMessage | null>(null)
  const [isThreadViewOpen, setIsThreadViewOpen] = useState(false)
  const messageThreadRef = useRef<HTMLDivElement>(null)

  // Find the current conversation
  const currentConversation = conversations.find((c) => c.id === conversationId)
  const otherParticipant = currentConversation?.other_participant

  // Check if the other participant is typing
  const isOtherParticipantTyping = typingUsers.some((user) => user.id === otherParticipant?.id)

  // Scroll to a specific message by ID
  const scrollToMessage = (messageId: string) => {
    if (!messageThreadRef.current) return

    const messageElement = messageThreadRef.current.querySelector(`[data-message-id="${messageId}"]`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" })

      // Highlight the message temporarily
      messageElement.classList.add("bg-yellow-100", "dark:bg-yellow-900/30")
      setTimeout(() => {
        messageElement.classList.remove("bg-yellow-100", "dark:bg-yellow-900/30")
      }, 2000)
    }

    // Close search after navigating to message
    setIsSearchOpen(false)
  }

  // Handle replying to a message
  const handleReplyToMessage = (message: DirectMessage) => {
    setReplyToMessage(message)
  }

  // Handle clearing reply
  const handleClearReply = () => {
    setReplyToMessage(null)
  }

  // Handle viewing a thread
  const handleViewThread = (message: DirectMessage) => {
    setActiveThread(message)
    setIsThreadViewOpen(true)
  }

  // Handle closing thread view
  const handleCloseThreadView = () => {
    setIsThreadViewOpen(false)
    setActiveThread(null)
  }

  return (
    <div className="grid h-full md:grid-cols-[320px_1fr]">
      {/* Keyboard shortcuts */}
      <KeyboardShortcuts onSearchOpen={() => setIsSearchOpen(true)} />

      {/* Thread view */}
      <ThreadView
        isOpen={isThreadViewOpen}
        onClose={handleCloseThreadView}
        parentMessage={activeThread}
        currentUser={currentUser}
        conversationId={conversationId}
      />

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
        <ConversationHeader
          participant={otherParticipant}
          isLoading={isLoadingConversations}
          isTyping={isOtherParticipantTyping}
          onSearchClick={() => setIsSearchOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Message thread */}
          <div className="flex-1 overflow-y-auto" ref={messageThreadRef}>
            <MessageThread
              messages={messages}
              currentUser={currentUser}
              isLoading={isLoadingMessages}
              onDeleteMessage={deleteMessage}
              onEditMessage={editMessage}
              isDeletingMessage={isDeletingMessage}
              isEditingMessage={isEditingMessage}
              onReplyToMessage={handleReplyToMessage}
              onViewThread={handleViewThread}
            />
            {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
          </div>

          {/* Search panel */}
          {isSearchOpen && (
            <div className="w-80 flex-shrink-0">
              <MessageSearch
                conversationId={conversationId}
                onClose={() => setIsSearchOpen(false)}
                onMessageSelect={scrollToMessage}
              />
            </div>
          )}
        </div>

        <MessageInput
          onSendMessage={sendMessage}
          onTyping={setTypingStatus}
          disabled={isLoadingMessages || !conversationId}
          replyToMessage={replyToMessage}
          currentUser={currentUser}
          onClearReply={handleClearReply}
        />
      </div>
    </div>
  )
}
