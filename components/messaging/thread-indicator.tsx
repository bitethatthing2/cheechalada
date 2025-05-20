"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThreadIndicatorProps {
  threadCount: number
  onClick: () => void
  className?: string
}

export function ThreadIndicator({ threadCount, onClick, className }: ThreadIndicatorProps) {
  if (threadCount <= 0) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-auto py-1 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={onClick}
    >
      <MessageCircle className="h-3 w-3" />
      {threadCount} {threadCount === 1 ? "reply" : "replies"}
    </Button>
  )
}
