"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AvatarPreviewProps {
  avatarUrl: string | null
  username?: string | null
  size?: "sm" | "md" | "lg" | "xl"
}

export function AvatarPreview({ avatarUrl, username, size = "md" }: AvatarPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={avatarUrl || ""} alt={username || "Avatar"} />
            <AvatarFallback>{username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{username || "Profile Picture"}</DialogTitle>
          <DialogDescription>View your profile picture</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-6">
          <Avatar className="h-64 w-64">
            <AvatarImage src={avatarUrl || ""} alt={username || "Avatar"} />
            <AvatarFallback className="text-4xl">{username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
        </div>
      </DialogContent>
    </Dialog>
  )
}
