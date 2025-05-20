"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

export function useOnlineStatus() {
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Update current user's online status
  useEffect(() => {
    const updateOnlineStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Update or insert online status
        const { error } = await supabase.from("online_status").upsert(
          {
            user_id: user.id,
            last_seen: new Date().toISOString(),
            is_online: true,
          },
          {
            onConflict: "user_id",
          },
        )

        if (error) throw error
      } catch (error) {
        console.error("Error updating online status:", error)
      }
    }

    // Update online status immediately and then every minute
    updateOnlineStatus()
    const interval = setInterval(updateOnlineStatus, 60000)

    // Set up listener for online status changes
    const onlineStatusChannel = supabase
      .channel("online_status_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "online_status",
        },
        () => {
          fetchOnlineUsers()
        },
      )
      .subscribe()

    // Fetch initial online users
    fetchOnlineUsers()

    // Set offline status when user leaves
    const handleBeforeUnload = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        await supabase
          .from("online_status")
          .update({
            is_online: false,
            last_seen: new Date().toISOString(),
          })
          .eq("user_id", user.id)
      } catch (error) {
        console.error("Error updating offline status:", error)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(onlineStatusChannel)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [supabase])

  const fetchOnlineUsers = async () => {
    try {
      setIsLoading(true)

      // Get users who are online (active in the last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const { data: onlineStatusData, error: onlineStatusError } = await supabase
        .from("online_status")
        .select("user_id")
        .eq("is_online", true)
        .gte("last_seen", fiveMinutesAgo)

      if (onlineStatusError) throw onlineStatusError

      if (onlineStatusData && onlineStatusData.length > 0) {
        const userIds = onlineStatusData.map((status) => status.user_id)

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds)

        if (profilesError) throw profilesError

        setOnlineUsers(profilesData || [])
      } else {
        setOnlineUsers([])
      }
    } catch (error) {
      console.error("Error fetching online users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    onlineUsers,
    isLoading,
    refreshOnlineUsers: fetchOnlineUsers,
  }
}
