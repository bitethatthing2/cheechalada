import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let supabase: ReturnType<typeof createSupabaseClient> | null = null

// Browser-safe client that works in both client and server components
export function createClient() {
  if (!supabase) {
    supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return supabase
}

// Export for compatibility with existing imports
export const createServerClient = createClient
