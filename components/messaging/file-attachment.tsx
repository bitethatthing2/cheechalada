"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { FileIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { UploadResult } from "@/lib/file-upload"

interface FileAttachmentProps {
  file: UploadResult
  onRemove?: () => void
  showRemoveButton?: boolean
  className?: string
}

export function FileAttachment({ file, onRemove, showRemoveButton = false, className = "" }: FileAttachmentProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(file.thumbnailUrl)
  const isImage = file.fileType.startsWith("image/")
  const isPdf = file.fileType === "application/pdf"

  // For images without thumbnails, try to generate one via the server API
  useEffect(() => {
    const generateThumbnail = async () => {
      if (isImage && !thumbnailUrl && file.fileUrl) {
        try {
          // Fetch the image from the fileUrl
          const response = await fetch(file.fileUrl)
          const blob = await response.blob()

          // Create a FormData object to send to the server
          const formData = new FormData()
          formData.append("file", blob, file.fileName)

          // Send to our thumbnail generation API
          const thumbnailResponse = await fetch("/api/generate-thumbnail", {
            method: "POST",
            body: formData,
          })

          if (thumbnailResponse.ok) {
            const data = await thumbnailResponse.json()
            if (data.thumbnailUrl) {
              setThumbnailUrl(data.thumbnailUrl)
            }
          }
        } catch (error) {
          console.error("Error generating thumbnail:", error)
        }
      }
    }

    generateThumbnail()
  }, [isImage, thumbnailUrl, file.fileUrl, file.fileName])

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {showRemoveButton && onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </Button>
      )}

      {isImage ? (
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={thumbnailUrl || file.fileUrl || "/placeholder.svg?height=300&width=300&query=image"}
            alt={file.fileName}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center aspect-square bg-muted">
          <FileIcon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      <div className="p-2 text-xs truncate">
        <div className="font-medium truncate" title={file.fileName}>
          {file.fileName}
        </div>
        <div className="text-muted-foreground">{formatFileSize(file.fileSize)}</div>
      </div>
    </Card>
  )
}
