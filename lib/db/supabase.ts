import { createClient } from "@supabase/supabase-js"
import type {
  ChatRoom,
  DirectConversation,
  DirectMessage,
  FileAttachment,
  MessageReaction,
  Profile,
  Task,
} from "./types"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

// Conversation related functions
export async function getConversations(userId: string): Promise<DirectConversation[]> {
  const { data, error } = await supabase
    .from("direct_participants")
    .select(`
      conversation_id,
      direct_conversations:conversation_id(*)
    `)
    .eq("user_id", userId)
    // Filter out soft-deleted conversations
    .eq("direct_conversations.is_deleted", false)

  if (error) {
    console.error("Error fetching conversations:", error)
    throw error
  }

  return data?.map((item) => item.direct_conversations) || []
}

export async function getConversationMessages(conversationId: string): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select(`
      *,
      sender:sender_id(id, username, avatar_url),
      attachments:file_attachments(*)
    `)
    .eq("conversation_id", conversationId)
    // Filter out soft-deleted messages
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    throw error
  }

  return data || []
}

export async function sendMessage(message: Partial<DirectMessage>): Promise<DirectMessage> {
  // Get current user for audit columns
  const currentUserId = await getCurrentUserId()

  // Add audit information
  const messageWithAudit = {
    ...message,
    created_by: currentUserId,
    updated_by: currentUserId,
    is_deleted: false,
  }

  const { data, error } = await supabase.from("direct_messages").insert([messageWithAudit]).select().single()

  if (error) {
    console.error("Error sending message:", error)
    throw error
  }

  return data
}

export async function deleteMessage(messageId: string): Promise<void> {
  // Get current user for audit columns
  const currentUserId = await getCurrentUserId()

  // Soft delete by setting is_deleted to true
  const { error } = await supabase
    .from("direct_messages")
    .update({
      is_deleted: true,
      updated_by: currentUserId,
    })
    .eq("id", messageId)

  if (error) {
    console.error("Error deleting message:", error)
    throw error
  }
}

export async function updateMessage(messageId: string, updates: Partial<DirectMessage>): Promise<DirectMessage> {
  // Get current user for audit columns
  const currentUserId = await getCurrentUserId()

  // Add audit information
  const updatesWithAudit = {
    ...updates,
    updated_by: currentUserId,
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .update(updatesWithAudit)
    .eq("id", messageId)
    .select()
    .single()

  if (error) {
    console.error("Error updating message:", error)
    throw error
  }

  return data
}

// File attachment functions
export async function uploadAttachment(file: File, messageId: string): Promise<FileAttachment> {
  // Get current user for audit columns
  const currentUserId = await getCurrentUserId()

  // Upload file to storage
  const fileName = `${Date.now()}_${file.name}`
  const filePath = `attachments/${messageId}/${fileName}`

  const { error: uploadError } = await supabase.storage.from("attachments").upload(filePath, file)

  if (uploadError) {
    console.error("Error uploading file:", uploadError)
    throw uploadError
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("attachments").getPublicUrl(filePath)

  // Create file attachment record with audit columns
  const attachment = {
    message_id: messageId,
    file_name: fileName,
    file_type: file.type,
    file_size: file.size,
    file_url: publicUrl,
    thumbnail_url: file.type.startsWith("image/") ? publicUrl : null,
    created_by: currentUserId,
    updated_by: currentUserId,
    is_deleted: false,
  }

  const { data, error } = await supabase.from("file_attachments").insert([attachment]).select().single()

  if (error) {
    console.error("Error creating file attachment:", error)
    throw error
  }

  return data
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  // Get current user for audit columns
  const currentUserId = await getCurrentUserId()

  // Soft delete by setting is_deleted to true
  const { error } = await supabase
    .from("file_attachments")
    .update({
      is_deleted: true,
      updated_by: currentUserId,
    })
    .eq("id", attachmentId)

  if (error) {
    console.error("Error deleting attachment:", error)
    throw error
  }
}

// User profile functions
export async function getUserProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }

  return data
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user profile:", error)
    throw error
  }

  return data
}

// Task management functions
export async function getUserTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    // Filter out soft-deleted tasks
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tasks:", error)
    throw error
  }

  return data || []
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase.from("tasks").insert([task]).select().single()

  if (error) {
    console.error("Error creating task:", error)
    throw error
  }

  return data
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase.from("tasks").update(updates).eq("id", taskId).select().single()

  if (error) {
    console.error("Error updating task:", error)
    throw error
  }

  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  // Soft delete by setting is_deleted to true
  const { error } = await supabase.from("tasks").update({ is_deleted: true }).eq("id", taskId)

  if (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

// Message reactions
export async function addReaction(reaction: Partial<MessageReaction>): Promise<MessageReaction> {
  const { data, error } = await supabase.from("message_reactions").insert([reaction]).select().single()

  if (error) {
    console.error("Error adding reaction:", error)
    throw error
  }

  return data
}

export async function removeReaction(reactionId: string): Promise<void> {
  const { error } = await supabase.from("message_reactions").delete().eq("id", reactionId)

  if (error) {
    console.error("Error removing reaction:", error)
    throw error
  }
}

// Chat rooms
export async function getChatRooms(): Promise<ChatRoom[]> {
  const { data, error } = await supabase.from("chat_rooms").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching chat rooms:", error)
    throw error
  }

  return data || []
}

export async function createChatRoom(room: Partial<ChatRoom>): Promise<ChatRoom> {
  const { data, error } = await supabase.from("chat_rooms").insert([room]).select().single()

  if (error) {
    console.error("Error creating chat room:", error)
    throw error
  }

  return data
}

// Create a new conversation with audit columns
export async function createConversation(participantIds: string[]): Promise<DirectConversation> {
  // Get current user for audit columns
  const currentUserId = await getCurrentUserId()

  if (!currentUserId) {
    throw new Error("User not authenticated")
  }

  // Create conversation with audit columns
  const { data: conversation, error: conversationError } = await supabase
    .from("direct_conversations")
    .insert([
      {
        created_by: currentUserId,
        updated_by: currentUserId,
        is_deleted: false,
      },
    ])
    .select()
    .single()

  if (conversationError) {
    console.error("Error creating conversation:", conversationError)
    throw conversationError
  }

  // Make sure current user is included in participants
  const allParticipantIds = [...new Set([...participantIds, currentUserId])]

  // Create participants
  const participants = allParticipantIds.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
  }))

  const { error: participantsError } = await supabase.from("direct_participants").insert(participants)

  if (participantsError) {
    console.error("Error adding participants:", participantsError)
    throw participantsError
  }

  return conversation
}

// Soft delete a conversation
export async function deleteConversation(conversationId: string): Promise<void> {
  // Get current user for audit columns
  const currentUserId = await getCurrentUserId()

  // Soft delete by setting is_deleted to true
  const { error } = await supabase
    .from("direct_conversations")
    .update({
      is_deleted: true,
      updated_by: currentUserId,
    })
    .eq("id", conversationId)

  if (error) {
    console.error("Error deleting conversation:", error)
    throw error
  }
}
