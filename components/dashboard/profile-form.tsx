"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/dashboard/avatar-upload"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional().nullable(),
  full_name: z.string().optional().nullable(),
  website: z.string().url("Please enter a valid URL").optional().nullable(),
})

type ProfileFormProps = {
  profile?: Profile | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || null,
      full_name: profile?.full_name || null,
      website: profile?.website || null,
    },
  })

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          full_name: data.full_name,
          website: data.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url)
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          {profile?.id && (
            <AvatarUpload userId={profile.id} avatarUrl={avatarUrl} onAvatarChange={handleAvatarChange} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>This is your public display name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
