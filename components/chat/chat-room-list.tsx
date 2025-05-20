"use client"

import type { ChatRoom } from "@/lib/types"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, Plus } from "lucide-react"

interface ChatRoomListProps {
  rooms: ChatRoom[]
  activeRoom: ChatRoom | null
  onSelectRoom: (room: ChatRoom) => void
  onCreateRoom: (name: string, description: string) => Promise<void>
  isDropdown?: boolean
  isMobile?: boolean
}

export function ChatRoomList({
  rooms,
  activeRoom,
  onSelectRoom,
  onCreateRoom,
  isDropdown = false,
  isMobile = false,
}: ChatRoomListProps) {
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return

    setIsCreating(true)
    try {
      await onCreateRoom(newRoomName, newRoomDescription)
      setNewRoomName("")
      setNewRoomDescription("")
      setIsDialogOpen(false)
    } finally {
      setIsCreating(false)
    }
  }

  const roomList = (
    <>
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
        <h2 className="text-lg font-semibold">Chat Rooms</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Room</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chat Room</DialogTitle>
              <DialogDescription>Create a new room for you and others to chat in.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="General Discussion"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="A place to discuss general topics"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRoom} disabled={!newRoomName.trim() || isCreating}>
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className={isMobile ? "h-[calc(100vh-5rem)]" : "h-[calc(100vh-13rem)]"}>
        <div className="space-y-1 p-2">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onSelectRoom(room)}
            >
              <Hash className="mr-2 h-4 w-4" />
              <span className="truncate">{room.name}</span>
            </Button>
          ))}
          {rooms.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No rooms available</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new room to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )

  if (isMobile) {
    return roomList
  }

  return <div className="h-full flex flex-col">{roomList}</div>
}
