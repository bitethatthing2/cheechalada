"use client"

import { useState, useEffect, useRef } from "react"
import type { DirectMessage, Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageInput } from "@/components/messaging/message-input"
import { MessageReactions } from "@/components/messaging/message-reactions"
import { FileAttachment } from "@/components/messaging/file-attachment"
import { format } from "date-fns"
import { X } from "lucide-react"
import type { UploadResult } from "@/lib/file-upload"

interface ThreadViewProps {
  isOpen: boolean
  onClose: () => void
  parentMessage: DirectMessage | null
  currentUser: Profile | null
  conversationId: string
}

export function ThreadView({ isOpen, onClose, parentMessage, currentUser, conversationId }: ThreadViewProps) {
  const [replies, setReplies] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch thread replies when parent message changes
  useEffect(() => {
    if (!parentMessage) {
      setReplies([])
      setIsLoading(false)
      return
    }

    const fetchReplies = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("direct_messages")
          .select("*, sender:profiles(*)")
          .eq("parent_message_id", parentMessage.id)
          .order("created_at", { ascending: true })

        if (error) throw error

        // For each reply, fetch its attachments if it has any
        const repliesWithAttachments = await Promise.all(
          data.map(async (reply) => {
            if (reply.has_attachment) {
              const { data: attachments } = await supabase
                .from("file_attachments")
                .select("*")
                .eq("message_id", reply.id)
                .order("created_at", { ascending: true })

              return { ...reply, attachments }
            }
            return reply
          }),
        )

        setReplies(repliesWithAttachments || [])
      } catch (error) {
        console.error("Error fetching thread replies:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen && parentMessage) {
      fetchReplies()
    }
  }, [supabase, parentMessage, isOpen])

  // Subscribe to new replies in this thread
  useEffect(() => {
    if (!parentMessage || !isOpen) return

    const repliesChannel = supabase
      .channel(`thread:${parentMessage.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `parent_message_id=eq.${parentMessage.id}`,
        },
        async (payload) => {
          // Fetch the sender profile for the new reply
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single()

          let newReply = {
            ...payload.new,
            sender: senderProfile,
          } as DirectMessage

          // If the reply has attachments, fetch them
          if (payload.new.has_attachment) {
            const { data: attachments } = await supabase
              .from("file_attachments")
              .select("*")
              .eq("message_id", payload.new.id)
              .order("created_at", { ascending: true })

            newReply = { ...newReply, attachments }
          }

          setReplies((prev) => [...prev, newReply])

          // Mark reply as read if it's not from the current user
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user && payload.new.sender_id !== user.id) {
            await supabase.from("direct_messages").update({ is_read: true }).eq("id", payload.new.id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(repliesChannel)
    }
  }, [supabase, parentMessage, isOpen])

  // Auto-scroll to bottom when new replies arrive
  useEffect(() => {
    if (isOpen && !isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [replies, isOpen, isLoading])

  const sendReply = async (content: string, attachments: UploadResult[] = []): Promise<boolean> => {
    if (!parentMessage || !conversationId || (content.trim() === "" && attachments.length === 0)) return false

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      // Insert the reply
      const { data: replyData, error: replyError } = await supabase
        .from("direct_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          is_read: false,
          has_attachment: attachments.length > 0,
          parent_message_id: parentMessage.id,
        })
        .select()
        .single()

      if (replyError) throw replyError

      // If there are attachments, insert them
      if (attachments.length > 0 && replyData) {
        const attachmentRecords = attachments.map((attachment) => ({
          message_id: replyData.id,
          file_name: attachment.fileName,
          file_size: attachment.fileSize,
          file_type: attachment.fileType,
          file_url: attachment.fileUrl!,
          thumbnail_url: attachment.thumbnailUrl,
        }))

        const { error: attachmentsError } = await supabase.from("file_attachments").insert(attachmentRecords)

        if (attachmentsError) throw attachmentsError
      }

      // Update the conversation's updated_at timestamp
      await supabase
        .from("direct_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)

      return true
    } catch (error) {
      console.error("Error sending reply:", error)
      return false
    }
  }

  if (!parentMessage) return null

  const hasAttachments = parentMessage.attachments && parentMessage.attachments.length > 0
  const isParentFromCurrentUser = parentMessage.sender_id === currentUser?.id

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Thread</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Parent message */}
          <div className="p-4 border-b">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={parentMessage.sender?.avatar_url || undefined}
                  alt={parentMessage.sender?.username || "User"}
                />
                <AvatarFallback>{parentMessage.sender?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {isParentFromCurrentUser
                      ? "You"
                      : parentMessage.sender?.full_name || parentMessage.sender?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(parentMessage.created_at), "MMM d, h:mm a")}
                  </span>
                </div>

                {/* File attachments */}
                {hasAttachments && (
                  <div className="mt-2 flex flex-col gap-2">
                    {parentMessage.attachments!.map((attachment) => (
                      <FileAttachment
                        key={attachment.id}
                        attachment={attachment}
                        isIncoming={!isParentFromCurrentUser}
                      />
                    ))}
                  </div>
                )}

                {/* Message content */}
                {parentMessage.content && (
                  <div className="mt-1">
                    <p className="whitespace-pre-wrap break-words">{parentMessage.content}</p>
                  </div>
                )}

                {/* Message reactions */}
                <div className="mt-2">
                  <MessageReactions messageId={parentMessage.id} currentUserId={currentUser?.id} />
                </div>
              </div>
            </div>
          </div>

          {/* Thread replies */}
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground">Loading replies...</div>
            ) : replies.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">No replies yet</div>
            ) : (
              replies.map((reply) => {
                const isReplyFromCurrentUser = reply.sender_id === currentUser?.id
                const hasReplyAttachments = reply.attachments && reply.attachments.length > 0

                return (
                  <div key={reply.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reply.sender?.avatar_url || undefined} alt={reply.sender?.username || "User"} />
                      <AvatarFallback>{reply.sender?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {isReplyFromCurrentUser ? "You" : reply.sender?.full_name || reply.sender?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reply.created_at), "h:mm a")}
                        </span>
                      </div>

                      {/* File attachments */}
                      {hasReplyAttachments && (
                        <div className="mt-2 flex flex-col gap-2">
                          {reply.attachments!.map((attachment) => (
                            <FileAttachment
                              key={attachment.id}
                              attachment={attachment}
                              isIncoming={!isReplyFromCurrentUser}
                            />
                          ))}
                        </div>
                      )}

                      {/* Reply content */}
                      {reply.content && (
                        <div className="mt-1">
                          <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                        </div>
                      )}

                      {/* Reply reactions */}
                      <div className="mt-2">
                        <MessageReactions messageId={reply.id} currentUserId={currentUser?.id} />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply input */}
        <div className="border-t">
          <MessageInput onSendMessage={sendReply} disabled={isLoading} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
