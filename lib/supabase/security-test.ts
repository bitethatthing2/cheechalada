import { createClient } from "@/lib/supabase/client"
import { createServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export interface SecurityTestItem {
  id: string
  name: string
  user_id: string
  created_at: string
}

/**
 * Get items from the security test table
 * This will only return items that belong to the current user due to RLS policies
 */
export async function getSecurityTestItems() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("security_test_table")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching security test items:", error)
    throw error
  }

  return data as SecurityTestItem[]
}

/**
 * Add a new item to the security test table
 * RLS will ensure the user_id matches the current user
 */
export async function addSecurityTestItem(name: string) {
  const supabase = createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    console.error("Error getting current user:", userError)
    throw userError || new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("security_test_table")
    .insert({
      name,
      user_id: userData.user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding security test item:", error)
    throw error
  }

  return data as SecurityTestItem
}

/**
 * Update an item in the security test table
 * RLS will prevent updating items that don't belong to the current user
 */
export async function updateSecurityTestItem(id: string, name: string) {
  const supabase = createClient()

  const { data, error } = await supabase.from("security_test_table").update({ name }).eq("id", id).select().single()

  if (error) {
    console.error("Error updating security test item:", error)
    throw error
  }

  return data as SecurityTestItem
}

/**
 * Delete an item from the security test table
 * RLS will prevent deleting items that don't belong to the current user
 */
export async function deleteSecurityTestItem(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("security_test_table").delete().eq("id", id)

  if (error) {
    console.error("Error deleting security test item:", error)
    throw error
  }

  return true
}

/**
 * Admin function to get all items regardless of user_id
 * This bypasses RLS and should only be used by admins
 */
export async function getAllSecurityTestItemsAsAdmin() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("security_test_table")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching all security test items:", error)
    throw error
  }

  return data as SecurityTestItem[]
}

/**
 * Test function to verify RLS policies
 * This will attempt to access items with different user IDs
 */
export async function testRlsPolicies(currentUser: User) {
  const supabase = createClient()

  // 1. Try to get own items (should succeed)
  const { data: ownItems, error: ownError } = await supabase
    .from("security_test_table")
    .select("*")
    .eq("user_id", currentUser.id)

  // 2. Try to get another user's items (should return empty due to RLS)
  const { data: otherItems, error: otherError } = await supabase
    .from("security_test_table")
    .select("*")
    .neq("user_id", currentUser.id)

  // 3. Try to update another user's item (should fail due to RLS)
  let updateError = null
  if (otherItems && otherItems.length > 0) {
    const { error } = await supabase
      .from("security_test_table")
      .update({ name: "Attempted update" })
      .eq("id", otherItems[0].id)

    updateError = error
  }

  return {
    ownItems: ownItems || [],
    ownItemsCount: ownItems?.length || 0,
    otherItems: otherItems || [],
    otherItemsCount: otherItems?.length || 0,
    updateError: updateError?.message || null,
    policiesWorking: {
      selectPolicy: otherItems?.length === 0,
      updatePolicy: !!updateError,
    },
  }
}
