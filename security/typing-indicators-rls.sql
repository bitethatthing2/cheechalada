-- Enable RLS on typing_indicators table
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view typing indicators in conversations they're part of
CREATE POLICY "Users can view typing indicators in their conversations" 
ON typing_indicators FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM direct_participants
    WHERE direct_participants.conversation_id = typing_indicators.conversation_id
    AND direct_participants.user_id = auth.uid()
  )
);

-- Policy: Users can only insert their own typing indicators
CREATE POLICY "Users can insert their own typing indicators" 
ON typing_indicators FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM direct_participants
    WHERE direct_participants.conversation_id = typing_indicators.conversation_id
    AND direct_participants.user_id = auth.uid()
  )
);

-- Policy: Users can only update their own typing indicators
CREATE POLICY "Users can update their own typing indicators" 
ON typing_indicators FOR UPDATE 
USING (user_id = auth.uid());

-- Policy: Users can only delete their own typing indicators
CREATE POLICY "Users can delete their own typing indicators" 
ON typing_indicators FOR DELETE 
USING (user_id = auth.uid());
