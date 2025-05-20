import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// List of admin email addresses
// In a production app, you would store this in a database table
const ADMIN_EMAILS = ["admin@example.com"] // Replace with actual admin emails

export async function middleware(request: NextRequest) {
  // Only run this middleware for admin routes
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  try {
    // Create a Supabase client
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If no user is logged in, redirect to login
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if the user is an admin
    const isAdmin = ADMIN_EMAILS.includes(user.email || "")

    // If not an admin, redirect to unauthorized page
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    // User is an admin, allow access
    return NextResponse.next()
  } catch (error) {
    console.error("Error in admin middleware:", error)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
}

export const config = {
  matcher: ["/admin/:path*"],
}
