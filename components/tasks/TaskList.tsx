"use client"

import { useEffect, useState } from "react"
import { getUserTasks, updateTask, deleteTask } from "@/lib/db/supabase"
import type { Task } from "@/lib/db/types"
import { Loader2, Trash2, Edit, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import TaskForm from "./TaskForm"

export default function TaskList({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true)
        const tasks = await getUserTasks(userId)
        setTasks(tasks)
      } catch (error) {
        console.error("Error loading tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadTasks()
    }
  }, [userId])

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const updatedTask = await updateTask(taskId, { is_completed: !isCompleted })
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)))
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      // This now uses soft delete
      await deleteTask(taskId)
      // Remove from UI
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      toast({
        title: "Success",
        description: "Task deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setIsDialogOpen(true)
  }

  const handleTaskSaved = (task: Task) => {
    if (editingTask) {
      // Update existing task
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    } else {
      // Add new task
      setTasks((prev) => [task, ...prev])
    }

    setIsDialogOpen(false)
    toast({
      title: "Success",
      description: editingTask ? "Task updated successfully." : "Task created successfully.",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button onClick={handleAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-gray-500">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className={`p-4 border rounded-lg ${task.is_completed ? "bg-gray-50" : ""}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={() => handleToggleComplete(task.id, task.is_completed)}
                  className="mt-1"
                />

                <div className="flex-1">
                  <h3 className={`font-medium ${task.is_completed ? "line-through text-gray-500" : ""}`}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className={`text-sm mt-1 ${task.is_completed ? "text-gray-400" : "text-gray-600"}`}>
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add Task"}</DialogTitle>
          </DialogHeader>

          <TaskForm userId={userId} task={editingTask} onTaskSaved={handleTaskSaved} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
