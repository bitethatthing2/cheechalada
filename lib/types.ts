export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  status: "pending" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  due_date: string | null
  created_at: string
  updated_at: string
}

export type TaskFormData = Omit<Task, "id" | "user_id" | "created_at" | "updated_at">

export type Message = {
  id: string
  user_id: string
  content: string
  created_at: string
  room_id: string
  is_edited: boolean
  profile?: Profile
}

export type ChatRoom = {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by: string | null
}
