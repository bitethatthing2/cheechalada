import { createClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]

export type UploadResult = {
  success: boolean
  fileUrl?: string
  thumbnailUrl?: string | null
  fileName: string
  fileSize: number
  fileType: string
  error?: string
}

export async function uploadFile(file: File): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      }
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: "File type not allowed",
      }
    }

    // Generate a unique file name to prevent collisions
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `message_attachments/${fileName}`

    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("attachments").upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath)

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (file.type.startsWith("image/")) {
      // For images, we can use the same URL as the thumbnail
      // In a production app, you might want to generate actual thumbnails
      thumbnailUrl = urlData.publicUrl
    }

    return {
      success: true,
      fileUrl: urlData.publicUrl,
      thumbnailUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return {
      success: false,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      error: "Failed to upload file",
    }
  }
}
