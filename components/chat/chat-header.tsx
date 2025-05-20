"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserList } from "./user-list"
import { Hash, Users } from "lucide-react"

export function ChatHeader() {
  const [showParticipants, setShowParticipants] = useState(false)

  return (
    <div className="border-b bg-background p-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Hash className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">Kitchen Chat</h2>
      </div>

      <Sheet open={showParticipants} onOpenChange={setShowParticipants}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Users className="h-5 w-5" />
            <span className="sr-only">Show participants</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <UserList />
        </SheetContent>
      </Sheet>
    </div>
  )
}
