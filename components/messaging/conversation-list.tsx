"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Search, MessageSquare } from "lucide-react"
import type { DirectConversation } from "@/lib/types"
import { format, isToday, isYesterday } from "date-fns"

interface ConversationListProps {
  conversations: DirectConversation[]
  isLoading: boolean
}

export function ConversationList({ conversations, isLoading }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MMM d")
    }
  }

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.other_participant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.other_participant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Messages</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-medium">No conversations yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Start a new conversation with someone</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => {
              const isActive = pathname === `/messaging/${conversation.id}`
              const hasUnread =
                conversation.last_message &&
                !conversation.last_message.is_read &&
                conversation.last_message.sender_id !== conversation.other_participant?.id

              return (
                <Link key={conversation.id} href={`/messaging/${conversation.id}`}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-2 py-3 h-auto",
                      isActive && "bg-accent",
                      hasUnread && "font-medium",
                    )}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage
                          src={conversation.other_participant?.avatar_url || undefined}
                          alt={conversation.other_participant?.username || "User"}
                        />
                        <AvatarFallback>
                          {conversation.other_participant?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium truncate">
                            {conversation.other_participant?.full_name ||
                              conversation.other_participant?.username ||
                              "User"}
                          </span>
                          {conversation.last_message && (
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {formatMessageDate(conversation.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <p
                            className={cn(
                              "text-sm truncate text-muted-foreground",
                              hasUnread && "text-foreground font-medium",
                            )}
                          >
                            {conversation.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                    {hasUnread && <div className="ml-auto w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                  </Button>
                </Link>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
