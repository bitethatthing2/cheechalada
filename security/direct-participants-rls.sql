-- Enable RLS on direct_participants table
ALTER TABLE direct_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view participants in conversations they're part of
CREATE POLICY "Users can view participants in their conversations" 
ON direct_participants FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM direct_participants dp
    WHERE dp.conversation_id = direct_participants.conversation_id 
    AND dp.user_id = auth.uid()
  )
);

-- Policy: Users can add themselves or others to conversations they're part of
CREATE POLICY "Users can add participants to their conversations" 
ON direct_participants FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM direct_participants dp
    WHERE dp.conversation_id = direct_participants.conversation_id 
    AND dp.user_id = auth.uid()
  )
);

-- Policy: Users can only remove participants from conversations they're part of
CREATE POLICY "Users can remove participants from their conversations" 
ON direct_participants FOR DELETE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM direct_participants dp
    WHERE dp.conversation_id = direct_participants.conversation_id 
    AND dp.user_id = auth.uid()
  )
);
