import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get items for the specified user
    const { data: userItems, error: userError } = await supabase
      .from("security_test_table")
      .select("*")
      .eq("user_id", userId)

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Get all items (admin access)
    const { data: allItems, error: allError } = await supabase.from("security_test_table").select("*")

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // Calculate items from other users
    const otherItems = allItems?.filter((item) => item.user_id !== userId) || []

    return NextResponse.json({
      userItems: userItems || [],
      userItemsCount: userItems?.length || 0,
      otherItems,
      otherItemsCount: otherItems.length,
      totalItems: allItems?.length || 0,
      rlsWorking: otherItems.length > 0, // If we can see other users' items as admin, RLS is working
    })
  } catch (error) {
    console.error("Error testing RLS:", error)
    return NextResponse.json({ error: "Failed to test RLS" }, { status: 500 })
  }
}
