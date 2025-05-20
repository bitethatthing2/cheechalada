import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email = "test@example.com", password = "password123" } = await request.json()

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

    return NextResponse.json({
      success: true,
      message: "Test user created successfully!",
      userId: data.user?.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create test user",
      },
      { status: 500 },
    )
  }
}
