// This is a Node.js script that you can run with:
// node scripts/create-test-user-cli.js

const { createClient } = require("@supabase/supabase-js")

async function createTestUser() {
  const email = process.argv[2] || "test@example.com"
  const password = process.argv[3] || "password123"

  console.log(`Creating test user with email: ${email} and password: ${password}`)

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Create a new user with the admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This automatically confirms the email
    })

    if (error) throw error

    console.log("User created successfully!")
    console.log("User ID:", data.user.id)

    // Create a profile for the user
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: email.split("@")[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      })

      if (profileError) throw profileError

      console.log("Profile created successfully!")

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

      console.log("Sample tasks created successfully!")
    }

    console.log("\nYou can now log in with:")
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  } catch (error) {
    console.error("Error creating test user:", error.message)
  }
}

createTestUser()
