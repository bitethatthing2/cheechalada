import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabase.rpc("check_rls_enabled", { table_name: tableName })

    if (rlsError) {
      return NextResponse.json({ error: rlsError.message }, { status: 500 })
    }

    // Get policies for the table
    const { data: policiesData, error: policiesError } = await supabase.rpc("get_table_policies", {
      table_name: tableName,
    })

    if (policiesError) {
      return NextResponse.json({ error: policiesError.message }, { status: 500 })
    }

    return NextResponse.json({
      tableName,
      hasRls: rlsData || false,
      policies: policiesData || [],
      isSecure: !!rlsData && policiesData?.length > 0,
    })
  } catch (error) {
    console.error("Error checking table security:", error)
    return NextResponse.json({ error: "Failed to check table security" }, { status: 500 })
  }
}
