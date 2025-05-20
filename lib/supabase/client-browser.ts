// This is a browser-safe version of the Supabase client
// that doesn't use any server-only features

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// This is safe to use in both client and server components
export function createBrowserClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// For compatibility with existing imports
export const createClient = createBrowserClient
export const createServerClient = createBrowserClient
