// This is a client-safe version of the Supabase client
// that doesn't use next/headers

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Export for compatibility with existing imports
export const createServerClient = createClient
