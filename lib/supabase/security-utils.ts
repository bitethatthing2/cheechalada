import { createClient } from "@/lib/supabase/client"

export interface TablePolicy {
  policyName: string
  operation: string
  definition: string
}

export interface TableSecurityStatus {
  tableName: string
  hasRls: boolean
  policies: TablePolicy[]
  isSecure: boolean
}

export async function checkTableSecurity(tableName: string): Promise<TableSecurityStatus> {
  try {
    const response = await fetch(`/api/security/check-table-security?table=${tableName}`)

    if (!response.ok) {
      throw new Error(`Failed to check security for ${tableName}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error checking security for ${tableName}:`, error)
    throw error
  }
}

export async function getAllTableSecurityStatus(): Promise<TableSecurityStatus[]> {
  const supabase = createClient()

  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase.rpc("get_all_tables")

    if (tablesError) throw tablesError

    if (!tables || tables.length === 0) {
      return []
    }

    // Check security for each table
    const securityPromises = tables.map(async (tableName: string) => {
      try {
        return await checkTableSecurity(tableName)
      } catch (error) {
        console.error(`Error checking security for ${tableName}:`, error)
        return {
          tableName,
          hasRls: false,
          policies: [],
          isSecure: false,
        }
      }
    })

    return await Promise.all(securityPromises)
  } catch (error) {
    console.error("Error getting all table security status:", error)
    throw error
  }
}

export async function applySecurityFix(tableName: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/security/apply-policy?table=${tableName}`, {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to apply security fix")
    }

    return true
  } catch (error) {
    console.error(`Error applying security fix to ${tableName}:`, error)
    return false
  }
}
