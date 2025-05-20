"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/db/supabase"
import TaskList from "@/components/tasks/TaskList"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function TasksPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="text-center p-4">
        <p>Please log in to view your tasks</p>
        <Button asChild className="mt-2">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Task Manager</h1>

      <TaskList userId={currentUserId} />
    </div>
  )
}
