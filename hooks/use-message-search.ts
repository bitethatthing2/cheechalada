"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DirectMessage } from "@/lib/types"
import { useDebounce } from "@/hooks/use-debounce"

export function useMessageSearch(conversationId: string | null) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<DirectMessage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const [totalResults, setTotalResults] = useState(0)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const supabase = createClient()

  // Reset search when conversation changes
  useEffect(() => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedResultIndex(-1)
    setTotalResults(0)
  }, [conversationId])

  // Perform search when debounced query changes
  useEffect(() => {
    if (!conversationId || !debouncedSearchQuery.trim()) {
      setSearchResults([])
      setTotalResults(0)
      return
    }

    const performSearch = async () => {
      setIsSearching(true)
      try {
        // Search for messages containing the query
        const { data, error, count } = await supabase
          .from("direct_messages")
          .select("*, sender:profiles(*)", { count: "exact" })
          .eq("conversation_id", conversationId)
          .ilike("content", `%${debouncedSearchQuery}%`)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        setSearchResults(data || [])
        setTotalResults(count || 0)
        setSelectedResultIndex(data && data.length > 0 ? 0 : -1)
      } catch (error) {
        console.error("Error searching messages:", error)
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedSearchQuery, conversationId, supabase])

  // Navigate through search results
  const navigateResults = useCallback(
    (direction: "next" | "previous") => {
      if (searchResults.length === 0) return

      if (direction === "next") {
        setSelectedResultIndex((prev) => (prev + 1) % searchResults.length)
      } else {
        setSelectedResultIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
      }
    },
    [searchResults],
  )

  // Get the currently selected message
  const selectedMessage = selectedResultIndex >= 0 ? searchResults[selectedResultIndex] : null

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedResultIndex,
    selectedMessage,
    totalResults,
    navigateResults,
  }
}
