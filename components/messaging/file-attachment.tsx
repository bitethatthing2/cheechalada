"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { FileIcon, Download, ExternalLink, ImageIcon, File } from "lucide-react"
import Image from "next/image"
import type { FileAttachment as FileAttachmentType } from "@/lib/types"

interface FileAttachmentProps {
  attachment: FileAttachmentType
  isIncoming?: boolean
}

export function FileAttachment({ attachment, isIncoming = false }: FileAttachmentProps) {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isFullImageLoaded, setIsFullImageLoaded] = useState(false)

  const isImage = attachment.file_type.startsWith("image/")
  const isPdf = attachment.file_type === "application/pdf"

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  // Get file icon based on type
  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5" />
    if (isPdf) return <FileIcon className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  // Handle file download
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = attachment.file_url
    link.download = attachment.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Use thumbnail for preview if available, otherwise use the original file
  const previewUrl = attachment.thumbnail_url || attachment.file_url

  return (
    <>
      <Card
        className={`p-2 max-w-xs overflow-hidden ${isIncoming ? "bg-muted" : "bg-primary text-primary-foreground"}`}
      >
        {isImage ? (
          <div className="space-y-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt={attachment.file_name}
                fill
                className="object-cover cursor-pointer"
                onClick={() => setIsImagePreviewOpen(true)}
                onLoad={() => setIsImageLoaded(true)}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="truncate text-xs">{attachment.file_name}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-3 w-3" />
                <span className="sr-only">Download</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted-foreground/10">
              {getFileIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{attachment.file_name}</div>
              <div className="text-xs opacity-70">{formatFileSize(attachment.file_size)}</div>
            </div>
            <div className="flex items-center gap-1">
              {isPdf && (
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" asChild title="Open">
                  <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    <span className="sr-only">Open</span>
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-3 w-3" />
                <span className="sr-only">Download</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Image preview dialog */}
      {isImage && (
        <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{attachment.file_name}</DialogTitle>
              <DialogDescription>
                {formatFileSize(attachment.file_size)} • {attachment.file_type}
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-auto max-h-[70vh] w-full overflow-hidden rounded-md">
              {/* Show thumbnail while full image loads */}
              {!isFullImageLoaded && attachment.thumbnail_url && (
                <Image
                  src={attachment.thumbnail_url || "/placeholder.svg"}
                  alt={`${attachment.file_name} (loading)`}
                  className="object-contain blur-sm"
                  fill
                />
              )}
              <Image
                src={attachment.file_url || "/placeholder.svg"}
                alt={attachment.file_name}
                className={`object-contain transition-opacity duration-300 ${
                  isFullImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                fill
                onLoad={() => setIsFullImageLoaded(true)}
                priority
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsImagePreviewOpen(false)}>
                Close
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
