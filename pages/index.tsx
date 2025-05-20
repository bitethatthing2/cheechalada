"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
// Import from browser-safe version
import { createClient } from "@/lib/supabase/client-browser"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push("/auth/login")
      } else {
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Loading...</div>
    </div>
  )
}
