"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Set up typing status
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const fetchTypingUsers = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get users who are typing in this conversation (except current user)
        const { data, error } = await supabase
          .from("typing_indicators")
          .select("user_id, profiles(*)")
          .eq("conversation_id", conversationId)
          .eq("is_typing", true)
          .neq("user_id", user.id)
          .order("last_updated", { ascending: false })

        if (error) throw error

        // Extract profiles from the data
        const typingProfiles = data
          .map((item) => item.profiles as Profile)
          .filter((profile): profile is Profile => !!profile)

        setTypingUsers(typingProfiles)
      } catch (error) {
        console.error("Error fetching typing users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTypingUsers()

    // Subscribe to typing status changes
    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchTypingUsers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(typingChannel)
    }
  }, [supabase, conversationId])

  // Function to update typing status
  const setTypingStatus = async (isTyping: boolean) => {
    if (!conversationId) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      // Update typing status
      const { error } = await supabase.from("typing_indicators").upsert(
        {
          user_id: user.id,
          conversation_id: conversationId,
          is_typing: isTyping,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id, conversation_id" },
      )

      if (error) throw error

      // If typing, set a timeout to automatically set typing to false after 5 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(async () => {
          await setTypingStatus(false)
        }, 5000)
      }
    } catch (error) {
      console.error("Error updating typing status:", error)
    }
  }

  return {
    typingUsers,
    isLoading,
    setTypingStatus,
  }
}
