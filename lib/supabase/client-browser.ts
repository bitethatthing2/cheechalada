import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client that works in both client and server environments
 * This is safe to use in pages/ directory components
 */
export function createBrowserClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Export aliases for compatibility with existing code
export const createClient = createBrowserClient
export const createServerClient = createBrowserClient
