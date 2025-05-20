-- Enable RLS on direct_conversations table
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view conversations they're part of
CREATE POLICY "Users can view their own conversations" 
ON direct_conversations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM direct_participants 
    WHERE direct_participants.conversation_id = direct_conversations.id 
    AND direct_participants.user_id = auth.uid()
  )
);

-- Policy: Users can insert conversations (will be restricted by direct_participants policies)
CREATE POLICY "Users can create conversations" 
ON direct_conversations FOR INSERT 
WITH CHECK (true);

-- Policy: Users can update conversations they're part of
CREATE POLICY "Users can update their conversations" 
ON direct_conversations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM direct_participants 
    WHERE direct_participants.conversation_id = direct_conversations.id 
    AND direct_participants.user_id = auth.uid()
  )
);

-- Policy: Users can delete conversations they're part of
CREATE POLICY "Users can delete their conversations" 
ON direct_conversations FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM direct_participants 
    WHERE direct_participants.conversation_id = direct_conversations.id 
    AND direct_participants.user_id = auth.uid()
  )
);
