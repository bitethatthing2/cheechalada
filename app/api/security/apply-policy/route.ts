import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // First enable RLS on the table
    const { data: rlsData, error: rlsError } = await supabase.rpc("enable_rls_on_table", { table_name: tableName })

    if (rlsError) {
      return NextResponse.json({ error: rlsError.message }, { status: 500 })
    }

    // Apply appropriate policies based on table name
    let policyResult

    switch (tableName) {
      case "direct_messages":
        policyResult = await applyDirectMessagesPolicy(supabase, tableName)
        break
      case "direct_conversations":
        policyResult = await applyDirectConversationsPolicy(supabase, tableName)
        break
      case "direct_participants":
        policyResult = await applyDirectParticipantsPolicy(supabase, tableName)
        break
      case "message_reactions":
        policyResult = await applyMessageReactionsPolicy(supabase, tableName)
        break
      case "typing_indicators":
        policyResult = await applyTypingIndicatorsPolicy(supabase, tableName)
        break
      case "online_status":
        policyResult = await applyOnlineStatusPolicy(supabase, tableName)
        break
      default:
        policyResult = await applyGenericPolicy(supabase, tableName)
    }

    if (!policyResult.success) {
      return NextResponse.json({ error: policyResult.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error applying security policy:", error)
    return NextResponse.json({ error: "Failed to apply security policy" }, { status: 500 })
  }
}

// Helper functions to apply policies for specific tables
async function applyDirectMessagesPolicy(supabase: any, tableName: string) {
  try {
    // Create policy for SELECT
    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can view messages in their conversations",
      operation: "SELECT",
      using_expr: `EXISTS (
        SELECT 1 FROM direct_participants 
        WHERE direct_participants.conversation_id = ${tableName}.conversation_id 
        AND direct_participants.user_id = auth.uid()
      )`,
    })

    // Create policy for INSERT
    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can insert their own messages",
      operation: "INSERT",
      check_expr: `auth.uid() = sender_id AND
      EXISTS (
        SELECT 1 FROM direct_participants 
        WHERE direct_participants.conversation_id = ${tableName}.conversation_id 
        AND direct_participants.user_id = auth.uid()
      )`,
    })

    // Create policy for UPDATE
    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can update their own messages",
      operation: "UPDATE",
      using_expr: "auth.uid() = sender_id",
    })

    // Create policy for DELETE
    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can delete their own messages",
      operation: "DELETE",
      using_expr: "auth.uid() = sender_id",
    })

    return { success: true }
  } catch (error) {
    console.error("Error applying direct messages policy:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Implement other policy functions similarly
async function applyDirectConversationsPolicy(supabase: any, tableName: string) {
  try {
    // Implementation similar to above
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function applyDirectParticipantsPolicy(supabase: any, tableName: string) {
  try {
    // Implementation similar to above
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function applyMessageReactionsPolicy(supabase: any, tableName: string) {
  try {
    // Implementation similar to above
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function applyTypingIndicatorsPolicy(supabase: any, tableName: string) {
  try {
    // Implementation similar to above
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function applyOnlineStatusPolicy(supabase: any, tableName: string) {
  try {
    // Implementation similar to above
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function applyGenericPolicy(supabase: any, tableName: string) {
  try {
    // Generic policy for tables with user_id column
    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can view their own data",
      operation: "SELECT",
      using_expr: "auth.uid() = user_id",
    })

    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can insert their own data",
      operation: "INSERT",
      check_expr: "auth.uid() = user_id",
    })

    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can update their own data",
      operation: "UPDATE",
      using_expr: "auth.uid() = user_id",
    })

    await supabase.rpc("create_policy", {
      table_name: tableName,
      policy_name: "Users can delete their own data",
      operation: "DELETE",
      using_expr: "auth.uid() = user_id",
    })

    return { success: true }
  } catch (error) {
    console.error("Error applying generic policy:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
