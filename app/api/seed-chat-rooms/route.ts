import { NextResponse } from "next/server"
import { seedChatRooms } from "@/lib/seed-chat-rooms"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    // Check if the user is authenticated and has admin privileges
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // You can add additional admin checks here if needed
    // For example, check if the user is in an admin group

    // Seed the chat rooms
    const result = await seedChatRooms()

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("Error seeding chat rooms:", error)
    return NextResponse.json({ error: "Failed to seed chat rooms" }, { status: 500 })
  }
}
