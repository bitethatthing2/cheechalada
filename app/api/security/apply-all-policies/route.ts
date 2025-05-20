import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Get all tables
    const { data: tables, error: tablesError } = await supabase.rpc("get_all_tables")

    if (tablesError) {
      return NextResponse.json({ error: `Failed to get tables: ${tablesError.message}` }, { status: 500 })
    }

    const results = []

    // Apply security to each table
    for (const tableName of tables) {
      try {
        // Enable RLS
        await supabase.rpc("enable_rls_on_table", { table_name: tableName })

        // Apply appropriate policies based on table name
        let policyResult

        switch (tableName) {
          case "direct_messages":
            // Implementation for direct_messages
            break
          case "direct_conversations":
            // Implementation for direct_conversations
            break
          case "direct_participants":
            // Implementation for direct_participants
            break
          case "message_reactions":
            // Implementation for message_reactions
            break
          case "typing_indicators":
            // Implementation for typing_indicators
            break
          case "online_status":
            // Implementation for online_status
            break
          default:
            // Apply generic policy
            await supabase.rpc("create_policy", {
              table_name: tableName,
              policy_name: "Users can view their own data",
              operation: "SELECT",
              using_expression: "auth.uid() = user_id",
            })
        }

        results.push({ table: tableName, success: true })
      } catch (error) {
        results.push({
          table: tableName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error applying all policies:", error)
    return NextResponse.json({ error: "Failed to apply security policies" }, { status: 500 })
  }
}
