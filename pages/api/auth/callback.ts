import type { NextApiRequest, NextApiResponse } from "next"
// Import from browser-safe version
import { createClient } from "@/lib/supabase/client-browser"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query

  if (code) {
    const supabase = createClient()

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(String(code))
  }

  // URL to redirect to after sign in process completes
  return res.redirect("/dashboard")
}
