"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdminNav } from "@/components/admin/admin-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { isCurrentUserAdmin } from "@/lib/supabase/admin-utils"
import { createClient } from "@/lib/supabase/client-browser"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setLoading(true)

        // First check if user is authenticated
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // Redirect to login if not authenticated
          router.push("/auth/login?redirect=/admin")
          return
        }

        // Then check if user is admin
        const adminStatus = await isCurrentUserAdmin()
        setIsAdmin(adminStatus)

        if (!adminStatus) {
          // Redirect to unauthorized page if not admin
          router.push("/unauthorized")
          return
        }
      } catch (err) {
        console.error("Error checking admin status:", err)
        setError("Failed to verify admin status. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show error state if authentication check failed
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Only render admin content if user is authenticated and is an admin
  if (!isAdmin) {
    return null // This should never render because we redirect in the useEffect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <MobileNav />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <UserNav />
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden md:block">
          <AdminNav />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden py-6">{children}</main>
      </div>
    </div>
  )
}

// Add dynamic export to prevent prerendering
export const dynamic = "force-dynamic"
