"use client"

import type { Task } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

export function DashboardTaskList({ tasks }: { tasks: Task[] }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            In Progress
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No tasks found</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between border-b pb-4">
            <div className="flex items-start gap-4">
              <div className={`h-2 w-2 rounded-full mt-2 ${getPriorityColor(task.priority)}`} />
              <div>
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{task.description || "No description"}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(task.status)}
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
