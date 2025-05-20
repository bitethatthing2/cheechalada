import { createClient } from "@/lib/supabase/server"

export async function checkRLSStatus() {
  const supabase = createClient()

  // List of tables to check
  const tables = [
    "profiles",
    "tasks",
    "messages",
    "chat_rooms",
    "file_attachments",
    "direct_conversations",
    "direct_messages",
    "direct_participants",
    "message_reactions",
    "typing_indicators",
    "online_status",
  ]

  const results: Record<
    string,
    {
      hasRLS: boolean
      policies: { name: string; operation: string }[]
    }
  > = {}

  for (const table of tables) {
    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabase.rpc("check_table_rls", { table_name: table })

    if (rlsError) {
      console.error(`Error checking RLS for ${table}:`, rlsError)
      continue
    }

    // Get policies for the table
    const { data: policiesData, error: policiesError } = await supabase.rpc("get_table_policies", { table_name: table })

    if (policiesError) {
      console.error(`Error getting policies for ${table}:`, policiesError)
      continue
    }

    results[table] = {
      hasRLS: rlsData?.has_rls || false,
      policies: policiesData || [],
    }
  }

  return results
}
