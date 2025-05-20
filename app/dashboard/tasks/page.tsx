import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TasksTable } from "@/components/dashboard/tasks-table"

export default async function TasksPage() {
  const supabase = await createClient()

  const { data: tasks } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">Manage your tasks here</p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>

      <TasksTable tasks={tasks || []} />
    </div>
  )
}
