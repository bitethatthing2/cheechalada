import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Browser-safe client that works in both client and server components
export function createBrowserClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Export aliases for compatibility with existing imports
export const createClient = createBrowserClient
export const createServerClient = createBrowserClient
