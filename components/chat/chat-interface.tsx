"use client"

import type { User } from "@supabase/supabase-js"
import type { Profile, ChatRoom, Message } from "@/lib/types"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChatRoomList } from "@/components/chat/chat-room-list"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { UserPresence } from "@/components/chat/user-presence"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Menu, Users } from "lucide-react"

interface ChatInterfaceProps {
  user: User
  profile: Profile | null
  initialRooms: ChatRoom[]
}

export function ChatInterface({ user, profile, initialRooms }: ChatInterfaceProps) {
  const supabase = createClient()
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(initialRooms.length > 0 ? initialRooms[0] : null)
  const [messages, setMessages] = useState<Message[]>([])
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms)
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [showMobileRooms, setShowMobileRooms] = useState(false)
  const [showMobileUsers, setShowMobileUsers] = useState(false)

  // Fetch messages for the active room
  useEffect(() => {
    if (!activeRoom) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("messages")
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq("room_id", activeRoom.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        // Reverse to get chronological order
        setMessages(data.reverse())
      } catch (error: any) {
        toast({
          title: "Error fetching messages",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch the user profile for the new message
            const { data: profile } = await supabase.from("profiles").select("*").eq("id", payload.new.user_id).single()

            const newMessage = {
              ...payload.new,
              profile,
            } as Message

            setMessages((prev) => [...prev, newMessage])
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((message) => (message.id === payload.new.id ? { ...message, ...payload.new } : message)),
            )
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((message) => message.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Subscribe to user presence
    const presenceSubscription = supabase
      .channel("online-users")
      .on("presence", { event: "sync" }, () => {
        const state = presenceSubscription.presenceState()
        const onlineUserIds = Object.keys(state)
        setOnlineUsers(onlineUserIds)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceSubscription.track({ user_id: user.id })
        }
      })

    return () => {
      supabase.removeChannel(messagesSubscription)
      supabase.removeChannel(presenceSubscription)
    }
  }, [supabase, activeRoom, user.id])

  // Subscribe to chat rooms changes
  useEffect(() => {
    const roomsSubscription = supabase
      .channel("chat_rooms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRooms((prev) => [...prev, payload.new as ChatRoom])
          } else if (payload.eventType === "UPDATE") {
            setRooms((prev) => prev.map((room) => (room.id === payload.new.id ? (payload.new as ChatRoom) : room)))
            if (activeRoom?.id === payload.new.id) {
              setActiveRoom(payload.new as ChatRoom)
            }
          } else if (payload.eventType === "DELETE") {
            setRooms((prev) => prev.filter((room) => room.id !== payload.old.id))
            if (activeRoom?.id === payload.old.id) {
              setRooms((prev) => (prev.length > 1 ? prev.filter((room) => room.id !== payload.old.id) : []))
              setActiveRoom(rooms[0] || null)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomsSubscription)
    }
  }, [supabase, activeRoom, rooms])

  const handleSendMessage = async (content: string) => {
    if (!activeRoom || !content.trim()) return

    try {
      const { error } = await supabase.from("messages").insert({
        content,
        user_id: user.id,
        room_id: activeRoom.id,
      })

      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async (id: string, content: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ content, is_edited: true })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error editing message",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (id: string) => {
    try {
      const { error } = await supabase.from("messages").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error deleting message",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCreateRoom = async (name: string, description: string) => {
    try {
      const id = name.toLowerCase().replace(/\s+/g, "-")
      const { data, error } = await supabase
        .from("chat_rooms")
        .insert({
          id,
          name,
          description,
          created_by: user.id,
        })
        .select()

      if (error) throw error

      if (data && data[0]) {
        setActiveRoom(data[0])
        setShowMobileRooms(false) // Close the mobile drawer after selecting
      }
    } catch (error: any) {
      toast({
        title: "Error creating room",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room)
    setShowMobileRooms(false) // Close the mobile drawer after selecting
  }

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-4">
      {/* Desktop sidebar */}
      <div className="hidden md:block md:col-span-1 border-r">
        <ChatRoomList
          rooms={rooms}
          activeRoom={activeRoom}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
        />
      </div>

      {/* Main chat area */}
      <div className="col-span-1 md:col-span-3 flex flex-col h-full">
        <Card className="flex-1 flex flex-col h-full border-0 rounded-none">
          {activeRoom ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{activeRoom.name}</h2>
                  <p className="text-sm text-muted-foreground truncate">{activeRoom.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mobile rooms drawer */}
                  <Sheet open={showMobileRooms} onOpenChange={setShowMobileRooms}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Open rooms</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                      <ChatRoomList
                        rooms={rooms}
                        activeRoom={activeRoom}
                        onSelectRoom={handleSelectRoom}
                        onCreateRoom={handleCreateRoom}
                        isMobile
                      />
                    </SheetContent>
                  </Sheet>

                  {/* Mobile users drawer */}
                  <Sheet open={showMobileUsers} onOpenChange={setShowMobileUsers}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden">
                        <Users className="h-4 w-4" />
                        <span className="sr-only">Online users</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0">
                      <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Online Users</h2>
                      </div>
                      <div className="p-4">
                        <UserPresence onlineUsers={onlineUsers} isMobile />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <MessageList
                  messages={messages}
                  currentUserId={user.id}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                  loading={loading}
                />
              </div>
              <Separator />
              <div className="p-4">
                <MessageInput onSendMessage={handleSendMessage} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <p className="text-muted-foreground mb-4">Select a chat room to start messaging</p>
                <Sheet open={showMobileRooms} onOpenChange={setShowMobileRooms}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden">
                      <Menu className="h-4 w-4 mr-2" />
                      Select a Room
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                    <ChatRoomList
                      rooms={rooms}
                      activeRoom={activeRoom}
                      onSelectRoom={handleSelectRoom}
                      onCreateRoom={handleCreateRoom}
                      isMobile
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Desktop user presence */}
      <UserPresence onlineUsers={onlineUsers} className="hidden md:block" />
    </div>
  )
}
