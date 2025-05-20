import { createClient } from "@/lib/supabase/server"

// Define the required chat rooms with their properties
export const REQUIRED_CHAT_ROOMS = [
  {
    id: "general",
    name: "General",
    description: "General chat room for everyone",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    description: "Chat room for kitchen discussions",
  },
  {
    id: "hustle-flow",
    name: "Hustle & Flow",
    description: "Channel for hustle and workflow discussions",
  },
  // Add more default rooms here as needed
]

export type ChatRoomSeedResult = {
  created: string[]
  updated: string[]
  errors: string[]
  existing: string[]
}

export async function seedChatRooms(): Promise<ChatRoomSeedResult> {
  const supabase = await createClient()

  const result: ChatRoomSeedResult = {
    created: [],
    updated: [],
    errors: [],
    existing: [],
  }

  // Process each required room
  for (const room of REQUIRED_CHAT_ROOMS) {
    try {
      // Check if the room exists
      const { data: existingRoom, error: fetchError } = await supabase
        .from("chat_rooms")
        .select("id, name, description")
        .eq("id", room.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        result.errors.push(`Error checking room ${room.id}: ${fetchError.message}`)
        continue
      }

      if (!existingRoom) {
        // Room doesn't exist, create it
        const { error: insertError } = await supabase.from("chat_rooms").insert(room)

        if (insertError) {
          result.errors.push(`Error creating room ${room.id}: ${insertError.message}`)
        } else {
          result.created.push(room.id)
        }
      } else {
        // Room exists, check if it needs updating
        if (existingRoom.name !== room.name || existingRoom.description !== room.description) {
          // Update the room
          const { error: updateError } = await supabase
            .from("chat_rooms")
            .update({
              name: room.name,
              description: room.description,
            })
            .eq("id", room.id)

          if (updateError) {
            result.errors.push(`Error updating room ${room.id}: ${updateError.message}`)
          } else {
            result.updated.push(room.id)
          }
        } else {
          // Room exists and is up to date
          result.existing.push(room.id)
        }
      }
    } catch (error) {
      result.errors.push(
        `Unexpected error with room ${room.id}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return result
}
