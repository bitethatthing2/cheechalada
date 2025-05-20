import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import sharp from "sharp"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check if file is an image
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
      // For SVGs and GIFs, return the original URL
      return NextResponse.json({ thumbnailUrl: null }, { status: 200 })
    }

    // Convert file to buffer for sharp processing
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate thumbnail using sharp
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 }) // Use WebP for better compression
      .withMetadata(false) // Strip metadata to reduce file size
      .toBuffer()

    // Upload thumbnail to Supabase Storage
    const thumbnailName = `${uuidv4()}.webp`
    const thumbnailPath = `message_attachments/thumbnails/${thumbnailName}`

    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from("attachments")
      .upload(thumbnailPath, thumbnailBuffer, { contentType: "image/webp" })

    if (thumbnailError) {
      console.error("Error uploading thumbnail:", thumbnailError)
      return NextResponse.json({ thumbnailUrl: null }, { status: 200 })
    }

    // Get the public URL for the thumbnail
    const { data: thumbnailUrlData } = supabase.storage.from("attachments").getPublicUrl(thumbnailPath)

    return NextResponse.json({ thumbnailUrl: thumbnailUrlData.publicUrl }, { status: 200 })
  } catch (error) {
    console.error("Error generating thumbnail:", error)
    return NextResponse.json({ error: "Failed to generate thumbnail" }, { status: 500 })
  }
}
