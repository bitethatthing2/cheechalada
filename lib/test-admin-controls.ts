import { createClient } from "@/lib/supabase/client"

/**
 * Test utility functions for admin controls
 */

// Test user IDs from our test data
const TEST_USER_1_ID = "11111111-1111-1111-1111-111111111111"
const TEST_USER_2_ID = "22222222-2222-2222-2222-222222222222"

/**
 * Tests if the current user has admin access
 */
export async function testAdminAccess(): Promise<{
  isAdmin: boolean
  message: string
}> {
  try {
    const response = await fetch("/api/admin/users")

    if (response.ok) {
      return {
        isAdmin: true,
        message: "You have admin access. API returned status 200.",
      }
    } else {
      const data = await response.json()
      return {
        isAdmin: false,
        message: `Admin access denied: ${data.error || response.statusText}`,
      }
    }
  } catch (error) {
    return {
      isAdmin: false,
      message: `Error testing admin access: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Tests if admin can see data from all users
 */
export async function testCrossUserDataAccess(): Promise<{
  success: boolean
  message: string
  user1Items?: number
  user2Items?: number
  totalItems?: number
}> {
  try {
    const response = await fetch("/api/admin/security-test")

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch data: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const items = data.items || []

    const user1Items = items.filter((item) => item.user_id === TEST_USER_1_ID)
    const user2Items = items.filter((item) => item.user_id === TEST_USER_2_ID)

    return {
      success: true,
      message: `Successfully retrieved data from multiple users`,
      user1Items: user1Items.length,
      user2Items: user2Items.length,
      totalItems: items.length,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing cross-user data access: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Tests if admin can modify data from other users
 */
export async function testModifyOtherUserData(): Promise<{
  success: boolean
  message: string
  itemId?: string
}> {
  try {
    // First, get items from user 2
    const response = await fetch("/api/admin/security-test")

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch data: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const items = data.items || []

    // Find an item from user 2
    const user2Item = items.find((item) => item.user_id === TEST_USER_2_ID)

    if (!user2Item) {
      return {
        success: false,
        message: "No items found for test user 2",
      }
    }

    // Try to update the item
    const updateResponse = await fetch("/api/admin/security-test", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user2Item.id,
        name: `${user2Item.name} (Modified by admin test)`,
      }),
    })

    if (!updateResponse.ok) {
      return {
        success: false,
        message: `Failed to update item: ${updateResponse.statusText}`,
      }
    }

    return {
      success: true,
      message: "Successfully modified data from another user",
      itemId: user2Item.id,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing modify other user data: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Tests if a regular user can access admin routes
 */
export async function testRegularUserAccess(): Promise<{
  canAccess: boolean
  message: string
}> {
  try {
    // This test should be run as a regular user
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      return {
        canAccess: false,
        message: "No user is logged in",
      }
    }

    // Try to access admin API
    const response = await fetch("/api/admin/users")

    if (response.ok) {
      return {
        canAccess: true,
        message: "WARNING: Regular user can access admin API!",
      }
    } else {
      return {
        canAccess: false,
        message: "Correctly denied access to admin API",
      }
    }
  } catch (error) {
    return {
      canAccess: false,
      message: `Error testing regular user access: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
