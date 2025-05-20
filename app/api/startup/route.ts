import { NextResponse } from "next/server"
import { seedChatRooms } from "@/lib/seed-chat-rooms"

// This route will be called during app startup
export async function GET() {
  try {
    console.log("Running startup tasks...")

    // Seed chat rooms
    const result = await seedChatRooms()
    console.log("Chat rooms seeded:", result)

    return NextResponse.json({
      success: true,
      message: "Startup tasks completed",
      chatRooms: result,
    })
  } catch (error) {
    console.error("Error during startup tasks:", error)
    return NextResponse.json({ error: "Startup tasks failed" }, { status: 500 })
  }
}
