import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This middleware works with both app/ and pages/ directories
export async function middleware(request: NextRequest) {
  // Create a Supabase client using the direct API, not next/headers
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
    },
  })

  // Get the auth token from the request cookies
  const authCookie = request.cookies.get("sb-access-token")?.value
  const refreshCookie = request.cookies.get("sb-refresh-token")?.value

  if (authCookie && refreshCookie) {
    // Set the auth token for this request
    supabase.auth.setSession({
      access_token: authCookie,
      refresh_token: refreshCookie,
    })
  }

  // Check if the user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Admin routes protection
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin (simplified check - replace with your logic)
    const isAdmin = user.email?.includes("admin") || false

    if (!isAdmin) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  // Protected routes
  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/messaging")) {
    if (!user) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
