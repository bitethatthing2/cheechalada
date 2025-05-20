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

export type OnlineStatus = {
  id: string
  user_id: string
  last_seen: string
  is_online: boolean
}

export type DirectConversation = {
  id: string
  created_at: string
  updated_at: string
  participants?: DirectParticipant[]
  last_message?: DirectMessage
  other_participant?: Profile // For convenience in UI
  unread_count?: number // Number of unread messages
}

export type DirectParticipant = {
  id: string
  conversation_id: string
  user_id: string
  created_at: string
  profile?: Profile
}

export type DirectMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
  sender?: Profile
}
