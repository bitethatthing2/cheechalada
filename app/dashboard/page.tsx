import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, ListTodo } from "lucide-react"
import { DashboardTaskList } from "@/components/dashboard/dashboard-task-list"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get tasks
  const { data: tasks } = await supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(5)

  // Get task stats
  const { data: taskStats } = await supabase.from("tasks").select("status")

  const totalTasks = taskStats?.length || 0
  const completedTasks = taskStats?.filter((task) => task.status === "completed").length || 0
  const pendingTasks = taskStats?.filter((task) => task.status === "pending").length || 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your tasks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your most recent tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardTaskList tasks={tasks || []} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
            <CardDescription>Your task completion rate</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex items-center justify-center h-[200px]">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted-foreground/20"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-primary"
                    strokeWidth="10"
                    strokeDasharray={`${totalTasks > 0 ? (completedTasks / totalTasks) * 251.2 : 0} 251.2`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl font-bold">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
