-- File attachments already have RLS enabled, but let's verify the policies

-- Policy: Users can view attachments in conversations they're part of
CREATE POLICY "Users can view attachments in their conversations" 
ON file_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN direct_participants dp ON dm.conversation_id = dp.conversation_id
    WHERE dm.id = file_attachments.message_id
    AND dp.user_id = auth.uid()
  )
);

-- Policy: Users can add attachments to their own messages
CREATE POLICY "Users can add attachments to their messages" 
ON file_attachments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM direct_messages dm
    WHERE dm.id = file_attachments.message_id
    AND dm.sender_id = auth.uid()
  )
);

-- Policy: Users can update their own attachments
CREATE POLICY "Users can update their own attachments" 
ON file_attachments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm
    WHERE dm.id = file_attachments.message_id
    AND dm.sender_id = auth.uid()
  )
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments" 
ON file_attachments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm
    WHERE dm.id = file_attachments.message_id
    AND dm.sender_id = auth.uid()
  )
);
