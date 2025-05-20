"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, PlusCircle } from "lucide-react";
import Link from "next/link";

interface ConversationsClientProps {
  userId: string;
}

export default function ConversationsClient({ userId }: ConversationsClientProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        
        // Fetch conversations from the database
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            conversations_participants!inner(
              participant:profiles(*)
            )
          `)
          .eq('conversations_participants.user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        
        setConversations(data || []);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadConversations();
    }
  }, [userId, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <Link href="/messaging">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No conversations yet</CardTitle>
            <CardDescription>Start a new conversation to chat with someone</CardDescription>
            <Link href="/messaging" className="mt-4">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Start a Conversation
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            // Find the other participant
            const otherParticipant = conversation.conversations_participants.find(
              (p: any) => p.participant.id !== userId
            )?.participant;

            return (
              <Link href={`/messaging/${conversation.id}`} key={conversation.id}>
                <Card className="hover:bg-secondary/20 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center">
                    <Avatar className="h-10 w-10 mr-4">
                      <img
                        src={otherParticipant?.avatar_url || "/placeholder-user.jpg"}
                        alt={otherParticipant?.full_name || "User"}
                      />
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {otherParticipant?.full_name || otherParticipant?.username || "Unknown User"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
