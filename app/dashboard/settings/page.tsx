import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/dashboard/settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <SettingsForm user={user} />
    </div>
  )
}
