"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
// Import from client-safe version instead of server version
import { createClient } from "@/lib/supabase/client-safe"

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
