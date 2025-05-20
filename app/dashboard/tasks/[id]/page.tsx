import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TaskForm } from "@/components/dashboard/task-form"

export default async function EditTaskPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: task, error } = await supabase.from("tasks").select("*").eq("id", params.id).single()

  if (error || !task) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Task</h2>
        <p className="text-muted-foreground">Update your task details</p>
      </div>

      <TaskForm task={task} isEditing />
    </div>
  )
}
