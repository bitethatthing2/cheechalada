import { TaskForm } from "@/components/dashboard/task-form"

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Task</h2>
        <p className="text-muted-foreground">Add a new task to your list</p>
      </div>

      <TaskForm />
    </div>
  )
}
