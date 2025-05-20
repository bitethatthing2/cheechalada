"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/db/supabase"
import { getUserProfile, updateUserProfile } from "@/lib/db/supabase"
import type { Profile } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, User, LinkIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [website, setWebsite] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("Not authenticated")
        }

        // Get user profile
        const profile = await getUserProfile(user.id)

        setProfile(profile)
        setUsername(profile.username || "")
        setFullName(profile.full_name || "")
        setWebsite(profile.website || "")
        setAvatarUrl(profile.avatar_url || "")
      } catch (error) {
        console.error("Error loading profile:", error)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      // Update profile
      await updateUserProfile(profile.id, {
        username,
        full_name: fullName,
        website,
        avatar_url: avatarUrl,
      })

      setSuccess("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    try {
      // Upload avatar to storage
      const fileExt = file.name.split(".").pop()
      const filePath = `avatars/${profile.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setError("Failed to upload avatar")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center p-4">
        <p>Please log in to view your profile</p>
        <Button asChild className="mt-2">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <div className="mb-6 flex justify-center">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} />
            <AvatarFallback>{(username || fullName || "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
          >
            <User className="h-4 w-4" />
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <div className="flex">
            <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="rounded-l-none"
              disabled={saving}
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        {success && <div className="text-sm text-green-500">{success}</div>}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  )
}
