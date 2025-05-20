import { seedChatRooms } from "../lib/seed-chat-rooms"

async function main() {
  console.log("Seeding chat rooms...")

  try {
    const result = await seedChatRooms()

    console.log("Chat room seeding completed:")
    console.log(`- Created: ${result.created.length} rooms (${result.created.join(", ")})`)
    console.log(`- Updated: ${result.updated.length} rooms (${result.updated.join(", ")})`)
    console.log(`- Existing: ${result.existing.length} rooms (${result.existing.join(", ")})`)

    if (result.errors.length > 0) {
      console.error("Errors encountered:")
      result.errors.forEach((error) => console.error(`- ${error}`))
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error("Failed to seed chat rooms:", error)
    process.exit(1)
  }
}

main()
