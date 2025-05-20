"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

interface UserPresenceProps {
  onlineUsers: string[]
  className?: string
  isMobile?: boolean
}

export function UserPresence({ onlineUsers, className, isMobile = false }: UserPresenceProps) {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})

  useEffect(() => {
    if (onlineUsers.length === 0) return

    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").in("id", onlineUsers)

        if (error) throw error

        const profileMap: Record<string, Profile> = {}
        data.forEach((profile) => {
          profileMap[profile.id] = profile
        })

        setProfiles(profileMap)
      } catch (error) {
        console.error("Error fetching profiles:", error)
      }
    }

    fetchProfiles()
  }, [supabase, onlineUsers])

  if (onlineUsers.length === 0) return null

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {onlineUsers.map((userId) => {
          const profile = profiles[userId]
          return (
            <div key={userId} className="flex flex-col items-center gap-2 p-2">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                    alt={profile?.username || "User"}
                  />
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <span className="text-sm font-medium text-center truncate max-w-full">
                {profile?.full_name || profile?.username || "User"}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-10", className)}>
      <TooltipProvider>
        <ScrollArea className="h-auto max-h-[calc(100vh-8rem)]">
          <div className="flex flex-col items-center gap-2 bg-background p-2 rounded-full shadow-md border">
            {onlineUsers.map((userId) => {
              const profile = profiles[userId]
              return (
                <Tooltip key={userId}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage
                          src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                          alt={profile?.username || "User"}
                        />
                        <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{profile?.full_name || profile?.username || "Online User"}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </ScrollArea>
      </TooltipProvider>
    </div>
  )
}
