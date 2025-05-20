import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get chat rooms
  const { data: chatRooms } = await supabase.from("chat_rooms").select("*").order("name", { ascending: true })

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-hidden">
        <ChatInterface user={user} profile={profile} initialRooms={chatRooms || []} />
      </div>
    </div>
  )
}
