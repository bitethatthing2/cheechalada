-- Enable RLS on message_reactions table
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on messages they can see
CREATE POLICY "Users can view reactions on accessible messages" 
ON message_reactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN direct_participants dp ON dm.conversation_id = dp.conversation_id
    WHERE dm.id = message_reactions.message_id
    AND dp.user_id = auth.uid()
  )
);

-- Policy: Users can add their own reactions
CREATE POLICY "Users can add their own reactions" 
ON message_reactions FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN direct_participants dp ON dm.conversation_id = dp.conversation_id
    WHERE dm.id = message_reactions.message_id
    AND dp.user_id = auth.uid()
  )
);

-- Policy: Users can update their own reactions
CREATE POLICY "Users can update their own reactions" 
ON message_reactions FOR UPDATE 
USING (user_id = auth.uid());

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" 
ON message_reactions FOR DELETE 
USING (user_id = auth.uid());
