"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageCropModal } from "@/components/dashboard/image-crop-modal"
import { AvatarGallery } from "@/components/dashboard/avatar-gallery"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, X, Grid } from "lucide-react"

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  onAvatarChange: (url: string) => void
}

export function AvatarUpload({ userId, avatarUrl, onAvatarChange }: AvatarUploadProps) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const objectUrl = URL.createObjectURL(file)
      setSelectedImage(objectUrl)
      setCropModalOpen(true)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to select image",
        variant: "destructive",
      })
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setUploading(true)

      // Create a preview URL for the cropped image
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob)
      setPreview(croppedImageUrl)

      // Create a file from the blob
      const fileExt = "jpeg" // We're converting to JPEG in the crop component
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const file = new File([croppedImageBlob], fileName, { type: "image/jpeg" })

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      onAvatarChange(data.publicUrl)
      toast({
        title: "Avatar updated",
        description: "Your profile image has been updated successfully",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Clean up object URLs to prevent memory leaks
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage)
        setSelectedImage(null)
      }
    }
  }

  const removeAvatar = async () => {
    try {
      setUploading(true)

      // Update profile with default avatar
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: defaultAvatar })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      setPreview(null)
      onAvatarChange(defaultAvatar)

      toast({
        title: "Avatar removed",
        description: "Your profile image has been reset to default",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleGallerySelect = (url: string) => {
    setPreview(null)
    onAvatarChange(url)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage
          src={preview || avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
          alt="Profile"
        />
        <AvatarFallback>{uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : "?"}</AvatarFallback>
      </Avatar>

      <div className="flex flex-wrap gap-2 justify-center">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </>
          )}
        </Button>

        <Button onClick={() => setGalleryOpen(true)} variant="outline" size="sm" disabled={uploading}>
          <Grid className="mr-2 h-4 w-4" />
          Choose Avatar
        </Button>

        {avatarUrl && (
          <Button onClick={removeAvatar} variant="outline" size="sm" disabled={uploading}>
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
          disabled={uploading}
        />
      </div>

      {selectedImage && (
        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false)
            if (selectedImage) {
              URL.revokeObjectURL(selectedImage)
              setSelectedImage(null)
            }
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}

      <AvatarGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        userId={userId}
        onAvatarSelect={handleGallerySelect}
      />
    </div>
  )
}
