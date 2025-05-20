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

  // Check if we have auth cookies
  const hasAuthCookies = authCookie && refreshCookie

  // Get the current path
  const path = request.nextUrl.pathname

  // Skip middleware for auth-related paths
  if (path.startsWith("/auth/") || path === "/auth") {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (hasAuthCookies) {
      try {
        // Set the auth token for this request
        await supabase.auth.setSession({
          access_token: authCookie,
          refresh_token: refreshCookie,
        })

        // Check if the session is valid
        const { data } = await supabase.auth.getUser()

        if (data.user) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } catch (error) {
        // If there's an error with the session, continue to the auth page
        console.error("Auth error in middleware:", error)
      }
    }

    // Allow access to auth pages for unauthenticated users
    return NextResponse.next()
  }

  // For all other routes, check authentication
  if (hasAuthCookies) {
    try {
      // Set the auth token for this request
      await supabase.auth.setSession({
        access_token: authCookie,
        refresh_token: refreshCookie,
      })

      // Check if the user is authenticated
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (!user) {
        // Invalid session, redirect to login
        const redirectUrl = new URL("/auth/login", request.url)
        redirectUrl.searchParams.set("redirect", path)
        return NextResponse.redirect(redirectUrl)
      }

      // Admin routes protection
      if (path.startsWith("/admin")) {
        // Check if user is admin (simplified check - replace with your logic)
        const isAdmin = user.email?.includes("admin") || false

        if (!isAdmin) {
          // Redirect to unauthorized page
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }
      }

      // User is authenticated and authorized, continue
      return NextResponse.next()
    } catch (error) {
      console.error("Auth error in middleware:", error)
      // Error with authentication, redirect to login
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", path)
      return NextResponse.redirect(redirectUrl)
    }
  } else {
    // No auth cookies, check if route requires authentication
    if (path.startsWith("/dashboard") || path.startsWith("/messaging") || path.startsWith("/admin")) {
      // Redirect to login
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", path)
      return NextResponse.redirect(redirectUrl)
    }

    // Public route, continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
