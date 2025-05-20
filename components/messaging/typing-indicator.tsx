"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Profile } from "@/lib/types"

interface TypingIndicatorProps {
  users: Profile[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  const [dots, setDots] = useState(".")

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "."
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (users.length === 0) return null

  let message = ""
  if (users.length === 1) {
    message = `${users[0].full_name || users[0].username || "Someone"} is typing${dots}`
  } else if (users.length === 2) {
    message = `${users[0].full_name || users[0].username || "Someone"} and ${
      users[1].full_name || users[1].username || "someone else"
    } are typing${dots}`
  } else {
    message = `${users.length} people are typing${dots}`
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={user.avatar_url || undefined} alt={user.username || "User"} />
            <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="typing-animation">
        <p>{message}</p>
      </div>
    </div>
  )
}
