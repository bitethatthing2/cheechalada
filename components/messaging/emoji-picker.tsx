"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

// Emoji categories
const categories = [
  { id: "recent", name: "Recent", emojis: [] },
  {
    id: "smileys",
    name: "😀",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
    ],
  },
  {
    id: "people",
    name: "👋",
    emojis: [
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "👍",
      "👎",
    ],
  },
  {
    id: "nature",
    name: "🐶",
    emojis: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🦆",
    ],
  },
  {
    id: "food",
    name: "🍎",
    emojis: [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🌮",
    ],
  },
  {
    id: "activities",
    name: "⚽",
    emojis: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🪀",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🪃",
      "🥅",
      "⛳",
    ],
  },
  {
    id: "travel",
    name: "🚗",
    emojis: [
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "🚓",
      "🚑",
      "🚒",
      "🚐",
      "🛻",
      "🚚",
      "🚛",
      "🚜",
      "🛵",
      "🏍️",
      "🛺",
      "🚲",
      "🛴",
      "🚂",
    ],
  },
  {
    id: "objects",
    name: "💡",
    emojis: [
      "💡",
      "🔦",
      "🧯",
      "🛢️",
      "💸",
      "💵",
      "💴",
      "💶",
      "💷",
      "💰",
      "💳",
      "💎",
      "⚖️",
      "🔧",
      "🔨",
      "⚒️",
      "🛠️",
      "⛏️",
      "🪓",
      "🔩",
    ],
  },
  {
    id: "symbols",
    name: "❤️",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "☮️",
    ],
  },
  {
    id: "flags",
    name: "🏁",
    emojis: [
      "🏁",
      "🚩",
      "🎌",
      "🏴",
      "🏳️",
      "🏳️‍🌈",
      "🏳️‍⚧️",
      "🏴‍☠️",
      "🇦🇨",
      "🇦🇩",
      "🇦🇪",
      "🇦🇫",
      "🇦🇬",
      "🇦🇮",
      "🇦🇱",
      "🇦🇲",
      "🇦🇴",
      "🇦🇶",
      "🇦🇷",
      "🇦🇸",
    ],
  },
]

// Common/frequently used emojis
const frequentlyUsedEmojis = ["👍", "❤️", "😂", "🔥", "😊", "🙏", "✨", "😍", "👏", "🎉"]

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("smileys")
  const [searchQuery, setSearchQuery] = useState("")
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentEmojis")
    if (stored) {
      try {
        setRecentEmojis(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse recent emojis", e)
      }
    }
  }, [])

  // Save emoji to recent emojis
  const saveToRecent = (emoji: string) => {
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 20)
    setRecentEmojis(updated)
    localStorage.setItem("recentEmojis", JSON.stringify(updated))
  }

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji)
    saveToRecent(emoji)
  }

  // Filter emojis based on search query
  const filteredEmojis = searchQuery
    ? categories.flatMap((category) => category.emojis).filter((emoji) => emoji.includes(searchQuery))
    : []

  return (
    <div className="w-full max-w-sm">
      <div className="relative mb-2">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search emoji..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery ? (
        <div className="h-[300px]">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-8 gap-1 p-2">
              {filteredEmojis.map((emoji) => (
                <Button key={emoji} variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEmojiSelect(emoji)}>
                  {emoji}
                </Button>
              ))}
              {filteredEmojis.length === 0 && (
                <div className="col-span-8 py-8 text-center text-muted-foreground">No emojis found</div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-10">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="p-2">
                {category.name === "Recent" ? "🕒" : category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Frequently used emojis */}
          <div className="border-b py-2">
            <div className="grid grid-cols-10 gap-1">
              {frequentlyUsedEmojis.map((emoji) => (
                <Button key={emoji} variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEmojiSelect(emoji)}>
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Category content */}
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="h-[220px] mt-0 pt-2">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-8 gap-1">
                  {(category.id === "recent" ? recentEmojis : category.emojis).map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                  {category.id === "recent" && recentEmojis.length === 0 && (
                    <div className="col-span-8 py-8 text-center text-muted-foreground">No recent emojis</div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
