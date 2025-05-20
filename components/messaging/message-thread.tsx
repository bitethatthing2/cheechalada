"use client"

import { useRef, useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageReactions } from "@/components/messaging/message-reactions"
import { MessageContextMenu } from "@/components/messaging/message-context-menu"
import { MessageEditor } from "@/components/messaging/message-editor"
import { FileAttachment } from "@/components/messaging/file-attachment"
import { ThreadIndicator } from "@/components/messaging/thread-indicator"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"
import type { DirectMessage, Profile } from "@/lib/types"

interface MessageThreadProps {
  messages: DirectMessage[]
  currentUser: Profile | null
  isLoading: boolean
  onDeleteMessage: (messageId: string) => Promise<boolean>
  onEditMessage: (messageId: string, newContent: string) => Promise<boolean>
  isDeletingMessage: string | null
  isEditingMessage: string | null
  onReplyToMessage: (message: DirectMessage) => void
  onViewThread: (message: DirectMessage) => void
}

export function MessageThread({
  messages,
  currentUser,
  isLoading,
  onDeleteMessage,
  onEditMessage,
  isDeletingMessage,
  isEditingMessage,
  onReplyToMessage,
  onViewThread,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? "" : "justify-end"}`}>
            {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-80" />
            </div>
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="font-medium">No messages yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Start the conversation!</p>
        </div>
      </div>
    )
  }

  // Filter out thread replies from the main conversation view
  const mainMessages = messages.filter((message) => !message.parent_message_id)

  // Group messages by date
  const groupedMessages: { [date: string]: DirectMessage[] } = {}
  mainMessages.forEach((message) => {
    const date = new Date(message.created_at).toDateString()
    if (!groupedMessages[date]) {
      groupedMessages[date] = []
    }
    groupedMessages[date].push(message)
  })

  const handleStartEditing = (messageId: string) => {
    setEditingMessageId(messageId)
  }

  const handleCancelEditing = () => {
    setEditingMessageId(null)
  }

  return (
    <div className="space-y-6 p-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-xs text-muted-foreground">
              {format(new Date(date), "MMMM d, yyyy")}
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {dateMessages.map((message, index) => {
            const isCurrentUser = message.sender_id === currentUser?.id
            const showAvatar = index === 0 || dateMessages[index - 1]?.sender_id !== message.sender_id
            const isLastMessage = index === dateMessages.length - 1
            const isLastMessageOfSender =
              index === dateMessages.length - 1 || dateMessages[index + 1]?.sender_id !== message.sender_id
            const isBeingDeleted = isDeletingMessage === message.id
            const isBeingEdited = isEditingMessage === message.id
            const isEditing = editingMessageId === message.id
            const hasAttachments = message.attachments && message.attachments.length > 0
            const hasThreads = message.thread_count && message.thread_count > 0

            return (
              <div
                key={message.id}
                className={cn(
                  "flex group",
                  isCurrentUser ? "justify-end" : "justify-start",
                  isBeingDeleted && "opacity-50",
                )}
                data-message-id={message.id}
              >
                <div className={cn("flex max-w-[80%] items-start gap-2", isCurrentUser && "flex-row-reverse")}>
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage
                        src={message.sender?.avatar_url || undefined}
                        alt={message.sender?.username || "User"}
                      />
                      <AvatarFallback>{message.sender?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" /> // Spacer for alignment
                  )}

                  <div className="flex flex-col">
                    {showAvatar && (
                      <div className={cn("flex items-center gap-2", isCurrentUser && "justify-end")}>
                        <span className="text-sm font-medium">
                          {isCurrentUser ? "You" : message.sender?.full_name || message.sender?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), "h:mm a")}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 mt-1">
                      {/* File attachments */}
                      {hasAttachments && (
                        <div className={cn("flex flex-col gap-2", isCurrentUser && "items-end")}>
                          {message.attachments!.map((attachment) => (
                            <FileAttachment key={attachment.id} attachment={attachment} isIncoming={!isCurrentUser} />
                          ))}
                        </div>
                      )}

                      {/* Message content */}
                      {message.content && !isEditing && (
                        <div className="flex items-end gap-1">
                          <div
                            className={cn(
                              "rounded-lg p-3 transition-colors duration-500 relative group",
                              isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>

                            {/* Edited indicator */}
                            {message.is_edited && <span className="text-xs opacity-70 ml-1">(edited)</span>}

                            {/* Context menu */}
                            <div
                              className={cn(
                                "absolute top-1",
                                isCurrentUser ? "-left-7" : "-right-7",
                                "opacity-0 group-hover:opacity-100 transition-opacity",
                              )}
                            >
                              <MessageContextMenu
                                messageId={message.id}
                                messageContent={message.content}
                                isOwnMessage={isCurrentUser}
                                onDelete={onDeleteMessage}
                                onReply={() => onReplyToMessage(message)}
                                onEdit={() => handleStartEditing(message.id)}
                                isDeleting={isBeingDeleted}
                                hasAttachments={hasAttachments}
                              />
                            </div>
                          </div>

                          {/* Read receipt indicator - only show for sender's messages and at the end of a message group */}
                          {isCurrentUser && isLastMessageOfSender && (
                            <div className="flex items-center mb-1 ml-1">
                              {message.is_read ? (
                                <CheckCheck className="h-4 w-4 text-primary" aria-label="Read" />
                              ) : (
                                <Check className="h-4 w-4 text-muted-foreground" aria-label="Delivered" />
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message editor */}
                      {isEditing && (
                        <div
                          className={cn(
                            "rounded-lg p-3 transition-colors duration-500",
                            isCurrentUser ? "bg-primary/10" : "bg-muted/80",
                          )}
                        >
                          <MessageEditor
                            messageId={message.id}
                            initialContent={message.content}
                            onSave={onEditMessage}
                            onCancel={handleCancelEditing}
                            isLoading={isBeingEdited}
                          />
                        </div>
                      )}
                    </div>

                    {/* Thread indicator */}
                    {hasThreads && (
                      <div className={cn("mt-1", isCurrentUser ? "text-right" : "text-left")}>
                        <ThreadIndicator
                          threadCount={message.thread_count!}
                          onClick={() => onViewThread(message)}
                          className={isCurrentUser ? "ml-auto" : "mr-auto"}
                        />
                      </div>
                    )}

                    {/* Message reactions */}
                    <div className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}>
                      <MessageReactions messageId={message.id} currentUserId={currentUser?.id} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
