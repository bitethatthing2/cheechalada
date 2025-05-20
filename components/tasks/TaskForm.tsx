"use client"

import type React from "react"

import { useState } from "react"
import { createTask, updateTask } from "@/lib/db/supabase"
import type { Task } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface TaskFormProps {
  userId: string
  task?: Task | null
  onTaskSaved: (task: Task) => void
}

export default function TaskForm({ userId, task, onTaskSaved }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    try {
      setLoading(true)
      setError("")

      let savedTask: Task

      if (task) {
        // Update existing task
        savedTask = await updateTask(task.id, {
          title,
          description: description || null,
        })
      } else {
        // Create new task
        savedTask = await createTask({
          user_id: userId,
          title,
          description: description || null,
          is_completed: false,
        })
      }

      onTaskSaved(savedTask)
    } catch (error) {
      console.error("Error saving task:", error)
      setError("Failed to save task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
      </div>

      <div>
        <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  )
}
