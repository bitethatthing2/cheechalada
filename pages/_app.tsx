"use client"

import type { AppProps } from "next/app"
import { useRouter } from "next/router"
import { useEffect } from "react"
// Import from client-safe version instead of server version
import { createClient } from "@/lib/supabase/client-safe"
import "@/app/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Check authentication on route changes
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && router.pathname !== "/auth/login") {
        router.push("/auth/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return <Component {...pageProps} />
}
