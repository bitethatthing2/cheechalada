// Use the browser-safe client instead of the server client
import { createClient as createClientBrowser } from "@/lib/supabase/client-browser"

// List of admin email addresses
// In a production app, you would store this in a database table
const ADMIN_EMAILS = ["admin@example.com"] // Replace with actual admin emails

/**
 * Checks if the current user is an admin (client-side)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = createClientBrowser()
  const { data } = await supabase.auth.getUser()

  if (!data.user) return false

  return ADMIN_EMAILS.includes(data.user.email || "")
}

/**
 * Checks if the current user is an admin (server-side)
 * This is a browser-safe version that works in both client and server components
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createClientBrowser()

  // Get the user's email
  const { data, error } = await supabase.from("profiles").select("email").eq("id", userId).single()

  if (error || !data) return false

  return ADMIN_EMAILS.includes(data.email || "")
}

/**
 * Gets data for all users, bypassing RLS
 * This should only be used in admin-protected routes
 */
export async function getDataForAllUsers<T>(tableName: string, columns = "*"): Promise<T[]> {
  const supabase = createClientBrowser()

  // Use service role to bypass RLS
  const { data, error } = await supabase.from(tableName).select(columns)

  if (error) {
    console.error(`Error fetching all data from ${tableName}:`, error)
    throw error
  }

  return data as T[]
}

/**
 * Updates data for any user, bypassing RLS
 * This should only be used in admin-protected routes
 */
export async function updateDataAsAdmin<T>(tableName: string, id: string, updates: Partial<T>): Promise<T> {
  const supabase = createClientBrowser()

  // Use service role to bypass RLS
  const { data, error } = await supabase.from(tableName).update(updates).eq("id", id).select().single()

  if (error) {
    console.error(`Error updating data in ${tableName}:`, error)
    throw error
  }

  return data as T
}

/**
 * Deletes data for any user, bypassing RLS
 * This should only be used in admin-protected routes
 */
export async function deleteDataAsAdmin(tableName: string, id: string): Promise<void> {
  const supabase = createClientBrowser()

  // Use service role to bypass RLS
  const { error } = await supabase.from(tableName).delete().eq("id", id)

  if (error) {
    console.error(`Error deleting data from ${tableName}:`, error)
    throw error
  }
}
