import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import ConversationsClient from './conversations-client';

// Force this route to be dynamic, not statically generated
export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  // Create client - will only run on the server
  const supabase = await createClient();

  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // If no user, redirect to login
    return redirect('/auth/login');
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading conversations...</div>}>
      <ConversationsClient userId={user.id} />
    </Suspense>
  );
}
