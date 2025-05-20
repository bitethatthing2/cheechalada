"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Copy, Trash, MoreVertical, Reply, Pencil } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface MessageContextMenuProps {
  messageId: string
  messageContent: string
  isOwnMessage: boolean
  onDelete: (messageId: string) => Promise<boolean>
  onReply?: (messageId: string, content: string) => void
  onEdit?: (messageId: string, content: string) => void
  isDeleting: boolean
  hasAttachments?: boolean
}

export function MessageContextMenu({
  messageId,
  messageContent,
  isOwnMessage,
  onDelete,
  onReply,
  onEdit,
  isDeleting,
  hasAttachments = false,
}: MessageContextMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageContent).then(
      () => {
        toast({
          description: "Message copied to clipboard",
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          variant: "destructive",
          description: "Failed to copy message",
        })
      },
    )
  }

  const handleDelete = async () => {
    const success = await onDelete(messageId)
    if (success) {
      toast({
        description: "Message deleted",
      })
    } else {
      toast({
        variant: "destructive",
        description: "Failed to delete message",
      })
    }
    setIsDeleteDialogOpen(false)
  }

  const handleReply = () => {
    if (onReply) {
      onReply(messageId, messageContent)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(messageId, messageContent)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleReply}>
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyText}>
            <Copy className="mr-2 h-4 w-4" />
            Copy text
          </DropdownMenuItem>
          {isOwnMessage && (
            <>
              <DropdownMenuSeparator />
              {/* Only show edit option for own messages with content and no attachments */}
              {messageContent.trim() !== "" && !hasAttachments && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
