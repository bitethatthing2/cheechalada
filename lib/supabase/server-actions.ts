// This file is ONLY for use in Server Components and Server Actions
import { cookies } from "next/headers"
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"

// Server-only client that requires next/headers
export async function createServerActionClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Admin functions that use server-side features
export async function getServerSideAdminData() {
  const supabase = await createServerActionClient()
  // Implementation...
}
