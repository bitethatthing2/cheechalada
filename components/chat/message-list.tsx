"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

// Define message and user types
type UserRole = "admin" | "kitchen" | "server" | "manager" | "customer"

interface User {
  id: string
  name: string
  role: UserRole
  avatar?: string
}

interface Message {
  id: string
  content: string
  userId: string
  timestamp: Date
}

interface MessageListProps {
  messages: Message[]
  currentUser: User | null
  users: Record<string, User>
  isLoading: boolean
}

export function MessageList({ messages, currentUser, users, isLoading }: MessageListProps) {
  // Role-based color mapping
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "text-red-500"
      case "kitchen":
        return "text-amber-500"
      case "server":
        return "text-blue-500"
      case "manager":
        return "text-purple-500"
      case "customer":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  // Role-based background color for messages
  const getRoleBgColor = (role: UserRole, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10"

    switch (role) {
      case "admin":
        return "bg-red-50 dark:bg-red-950/20"
      case "kitchen":
        return "bg-amber-50 dark:bg-amber-950/20"
      case "server":
        return "bg-blue-50 dark:bg-blue-950/20"
      case "manager":
        return "bg-purple-50 dark:bg-purple-950/20"
      case "customer":
        return "bg-green-50 dark:bg-green-950/20"
      default:
        return "bg-gray-50 dark:bg-gray-800/50"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-80" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const user = users[message.userId] || { name: "Unknown User", role: "customer" as UserRole }
        const isCurrentUserMessage = currentUser?.id === message.userId

        return (
          <div key={message.id} className={`flex ${isCurrentUserMessage ? "justify-end" : "justify-start"}`}>
            <div className="flex max-w-[80%] items-start gap-3">
              {!isCurrentUserMessage && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className={getRoleColor(user.role)}>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getRoleColor(user.role)}`}>
                    {isCurrentUserMessage ? "You" : user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{format(new Date(message.timestamp), "h:mm a")}</span>
                </div>

                <div className={`mt-1 rounded-lg p-3 ${getRoleBgColor(user.role, isCurrentUserMessage)}`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>

              {isCurrentUserMessage && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} alt={currentUser?.name} />
                  <AvatarFallback className={getRoleColor(currentUser?.role || "customer")}>
                    {currentUser?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
