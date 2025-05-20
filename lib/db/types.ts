export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  website: string
  created_at: string
  updated_at: string
}

export interface DirectConversation {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  is_deleted: boolean
}

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
  has_attachment: boolean
  parent_message_id: string | null
  thread_count: number
  is_edited: boolean
  created_by: string
  updated_by: string
  is_deleted: boolean
}

export interface DirectParticipant {
  id: string
  conversation_id: string
  user_id: string
  created_at: string
}

export interface FileAttachment {
  id: string
  message_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  is_deleted: boolean
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface ChatRoom {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by: string
}
