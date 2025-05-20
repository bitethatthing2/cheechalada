import { createClient } from "@/lib/supabase/client"

/**
 * Verifies that RLS policies are working correctly
 */
export async function verifyRlsPolicies() {
  const supabase = createClient()

  // Get the current user
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return {
      success: false,
      message: "No user is logged in",
    }
  }

  const currentUserId = authData.user.id

  // Try to get all items from security_test_table
  const { data: items, error } = await supabase.from("security_test_table").select("*")

  if (error) {
    return {
      success: false,
      message: `Error fetching data: ${error.message}`,
    }
  }

  // Check if all items belong to the current user
  const allBelongToCurrentUser = items.every((item) => item.user_id === currentUserId)

  // Count items by user
  const itemsByUser = items.reduce(
    (acc, item) => {
      acc[item.user_id] = (acc[item.user_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const userCount = Object.keys(itemsByUser).length

  return {
    success: allBelongToCurrentUser,
    message: allBelongToCurrentUser
      ? "RLS policies are working correctly - you can only see your own data"
      : "RLS policies may not be working - you can see data from other users",
    itemCount: items.length,
    userCount,
    itemsByUser,
  }
}
