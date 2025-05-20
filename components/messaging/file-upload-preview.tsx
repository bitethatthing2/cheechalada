"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, FileIcon, ImageIcon, File } from "lucide-react"
import Image from "next/image"
import type { UploadResult } from "@/lib/file-upload"

interface FileUploadPreviewProps {
  attachments: UploadResult[]
  onRemove: (index: number) => void
}

export function FileUploadPreview({ attachments, onRemove }: FileUploadPreviewProps) {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType === "application/pdf") return <FileIcon className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <Card key={index} className="relative p-2 max-w-[120px]">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-background shadow-sm"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove</span>
          </Button>

          {attachment.fileType.startsWith("image/") && attachment.fileUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-md">
              <Image
                src={attachment.fileUrl || "/placeholder.svg"}
                alt={attachment.fileName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
              {getFileIcon(attachment.fileType)}
            </div>
          )}

          <div className="mt-1 w-full">
            <div className="truncate text-xs font-medium">{attachment.fileName}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}
