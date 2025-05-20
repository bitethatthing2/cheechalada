"use client"

import { useState, useRef, useEffect } from "react"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { ChatHeader } from "./chat-header"
import { useMessages } from "@/hooks/use-messages"
import { useUsers } from "@/hooks/use-users"

export function ChatInterface() {
  const { messages, sendMessage, isLoading } = useMessages()
  const { currentUser, users } = useUsers()
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return
    await sendMessage(content)
    setInputValue("")
  }

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Fixed header */}
      <ChatHeader />

      {/* Scrollable message area that takes available space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList messages={messages} currentUser={currentUser} users={users} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed message input at bottom */}
      <div className="border-t bg-background p-4 sticky bottom-0 left-0 right-0">
        <MessageInput value={inputValue} onChange={setInputValue} onSend={handleSendMessage} />
      </div>
    </div>
  )
}
