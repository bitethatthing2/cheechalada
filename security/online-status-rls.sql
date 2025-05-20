-- Enable RLS on online_status table
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view online status of all users
-- This is a common pattern for online status to be public
CREATE POLICY "Users can view all online statuses" 
ON online_status FOR SELECT 
USING (true);

-- Policy: Users can only update their own online status
CREATE POLICY "Users can update their own online status" 
ON online_status FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own online status
CREATE POLICY "Users can update their own online status" 
ON online_status FOR UPDATE 
USING (user_id = auth.uid());

-- Policy: Users can only delete their own online status
CREATE POLICY "Users can delete their own online status" 
ON online_status FOR DELETE 
USING (user_id = auth.uid());
