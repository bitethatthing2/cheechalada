import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return <div className="flex flex-col h-full">{children}</div>
}
