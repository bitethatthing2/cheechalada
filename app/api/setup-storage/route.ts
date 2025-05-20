import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if the avatars bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const avatarBucketExists = buckets?.some((bucket) => bucket.name === "avatars")

    // Create the avatars bucket if it doesn't exist
    if (!avatarBucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
      })

      if (createBucketError) {
        throw createBucketError
      }
    }

    // Set up storage policies for the avatars bucket
    const { error: policyError } = await supabase.storage
      .from("avatars")
      .createPolicy("authenticated users can upload avatars", {
        name: "authenticated can upload",
        definition: {
          role: "authenticated",
          operation: "INSERT",
          match: {
            prefix: "",
          },
        },
      })

    if (policyError) {
      console.warn("Policy error (may already exist):", policyError.message)
    }

    return NextResponse.json({
      success: true,
      message: "Storage bucket and policies set up successfully",
    })
  } catch (error: any) {
    console.error("Error setting up storage:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to set up storage",
      },
      { status: 500 },
    )
  }
}
