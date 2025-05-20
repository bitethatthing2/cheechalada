"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function CreateTestUser() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if current user is admin
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setCurrentUser(data.user)

      // Safe access to email with fallback
      const userEmail = data.user?.email || ""

      // Check if user is admin - replace with your admin emails
      const adminEmails = ["admin@example.com"] // Add your admin emails here
      setIsAdmin(adminEmails.includes(userEmail))
    }

    checkUser()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/create-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `User created successfully! Email: ${email}, Password: ${password}`,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create user",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  // If not logged in or not admin, show unauthorized message
  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Checking authentication status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unauthorized</AlertTitle>
        <AlertDescription>
          You do not have permission to access this page. Please contact an administrator.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Test User</CardTitle>
        <CardDescription>Create a test user for development purposes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <CardFooter className="flex justify-between px-0 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </CardFooter>
        </form>
      </CardContent>
      {result && (
        <CardFooter>
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  )
}
