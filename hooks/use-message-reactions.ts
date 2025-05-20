"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MessageReaction, Profile } from "@/lib/types"

export function useMessageReactions(messageId: string | null) {
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!messageId) {
      setReactions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const fetchReactions = async () => {
      try {
        // Get reactions for this message with user profiles
        const { data, error } = await supabase
          .from("message_reactions")
          .select("*, user:profiles(*)")
          .eq("message_id", messageId)
          .order("created_at", { ascending: true })

        if (error) throw error

        setReactions(data || [])
      } catch (error) {
        console.error("Error fetching message reactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReactions()

    // Subscribe to reaction changes
    const reactionsChannel = supabase
      .channel(`reactions:${messageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          fetchReactions()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(reactionsChannel)
    }
  }, [supabase, messageId])

  const addReaction = async (emoji: string): Promise<boolean> => {
    if (!messageId) return false

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      // Check if the user already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle()

      if (existingReaction) {
        // If the reaction exists, remove it (toggle behavior)
        const { error } = await supabase.from("message_reactions").delete().eq("id", existingReaction.id)
        if (error) throw error
      } else {
        // Otherwise, add the reaction
        const { error } = await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji: emoji,
        })
        if (error) throw error
      }

      return true
    } catch (error) {
      console.error("Error adding/removing reaction:", error)
      return false
    }
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce<Record<string, { count: number; users: Profile[] }>>((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, users: [] }
    }
    acc[reaction.emoji].count += 1
    if (reaction.user) {
      acc[reaction.emoji].users.push(reaction.user as Profile)
    }
    return acc
  }, {})

  return {
    reactions,
    groupedReactions,
    isLoading,
    addReaction,
  }
}
