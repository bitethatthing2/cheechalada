import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 },
      )
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if the user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      )
    }

    // Create some sample tasks for the user
    const { error: tasksError } = await supabase.from("tasks").insert([
      {
        user_id: userId,
        title: "Complete project setup",
        description: "Finish setting up the project structure and dependencies",
        status: "completed",
        priority: "high",
        due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
      {
        user_id: userId,
        title: "Design user dashboard",
        description: "Create wireframes and mockups for the user dashboard",
        status: "in_progress",
        priority: "medium",
        due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      },
      {
        user_id: userId,
        title: "Implement authentication",
        description: "Set up user authentication with Supabase",
        status: "pending",
        priority: "high",
        due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      },
      {
        user_id: userId,
        title: "Write documentation",
        description: "Document the API and user flows",
        status: "pending",
        priority: "low",
        due_date: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
      },
    ])

    if (tasksError) throw tasksError

    return NextResponse.json({
      success: true,
      message: "Sample data created successfully!",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create sample data",
      },
      { status: 500 },
    )
  }
}
