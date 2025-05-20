"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreateTestUser() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("password123")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; userId?: string }>({})

  const handleCreateUser = async () => {
    setLoading(true)
    setResult({})

    try {
      // Create a Supabase client with the service role key
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      // Create a new user with the admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // This automatically confirms the email
      })

      if (error) throw error

      // Create a profile for the user
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: email.split("@")[0],
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        })

        if (profileError) throw profileError

        // Create some sample tasks for the user
        const { error: tasksError } = await supabase.from("tasks").insert([
          {
            user_id: data.user.id,
            title: "Complete project setup",
            description: "Finish setting up the project structure and dependencies",
            status: "completed",
            priority: "high",
            due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          },
          {
            user_id: data.user.id,
            title: "Design user dashboard",
            description: "Create wireframes and mockups for the user dashboard",
            status: "in_progress",
            priority: "medium",
            due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          },
          {
            user_id: data.user.id,
            title: "Implement authentication",
            description: "Set up user authentication with Supabase",
            status: "pending",
            priority: "high",
            due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          },
          {
            user_id: data.user.id,
            title: "Write documentation",
            description: "Document the API and user flows",
            status: "pending",
            priority: "low",
            due_date: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
          },
        ])

        if (tasksError) throw tasksError
      }

      setResult({
        success: true,
        message: "Test user created successfully!",
        userId: data.user?.id,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to create test user",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Test User</CardTitle>
          <CardDescription>Create a test user with pre-confirmed email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleCreateUser} disabled={loading}>
            {loading ? "Creating..." : "Create Test User"}
          </Button>

          {result.success !== undefined && (
            <div
              className={`w-full p-3 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              <p>{result.message}</p>
              {result.userId && (
                <p className="mt-2 text-sm">
                  User ID: <code className="bg-gray-100 p-1 rounded">{result.userId}</code>
                </p>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
