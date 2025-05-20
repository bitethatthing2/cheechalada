"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Search, X, ChevronUp, ChevronDown } from "lucide-react"
import { useMessageSearch } from "@/hooks/use-message-search"
import { cn } from "@/lib/utils"

interface MessageSearchProps {
  conversationId: string | null
  onClose: () => void
  onMessageSelect: (messageId: string) => void
}

export function MessageSearch({ conversationId, onClose, onMessageSelect }: MessageSearchProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedResultIndex,
    totalResults,
    navigateResults,
  } = useMessageSearch(conversationId)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "Enter" && searchResults[selectedResultIndex]) {
        onMessageSelect(searchResults[selectedResultIndex].id)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        navigateResults("next")
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        navigateResults("previous")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, searchResults, selectedResultIndex, navigateResults, onMessageSelect])

  // Highlight search terms in message content
  const highlightSearchTerms = (content: string, query: string) => {
    if (!query.trim()) return content

    const regex = new RegExp(`(${query.trim()})`, "gi")
    const parts = content.split(regex)

    return parts.map((part, i) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search messages..."
            className="pl-8 pr-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close search</span>
        </Button>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm text-muted-foreground">
          {isSearching
            ? "Searching..."
            : searchQuery
              ? `${totalResults} ${totalResults === 1 ? "result" : "results"}`
              : "Enter search terms"}
        </span>
        {searchResults.length > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateResults("previous")}
              disabled={searchResults.length <= 1}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="sr-only">Previous result</span>
            </Button>
            <span className="text-sm">
              {selectedResultIndex + 1} of {searchResults.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateResults("next")}
              disabled={searchResults.length <= 1}
            >
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Next result</span>
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isSearching ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="p-2">
            {searchResults.map((message, index) => (
              <Button
                key={message.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start px-3 py-2 h-auto text-left",
                  index === selectedResultIndex && "bg-accent",
                )}
                onClick={() => onMessageSelect(message.id)}
              >
                <div className="flex flex-col w-full gap-1">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">
                      {message.sender?.full_name || message.sender?.username || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-left line-clamp-2 text-muted-foreground">
                    {highlightSearchTerms(message.content, searchQuery)}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <p className="text-muted-foreground">No messages found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Search for messages</p>
              <p className="text-sm text-muted-foreground mt-1">Type to start searching</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
