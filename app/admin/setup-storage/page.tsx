"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function SetupStoragePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const setupStorage = async () => {
    setStatus("loading")
    try {
      const response = await fetch("/api/setup-storage")
      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message)
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "Failed to set up storage")
    }
  }

  useEffect(() => {
    // Auto-run setup on page load
    setupStorage()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Storage Setup</CardTitle>
          <CardDescription>Setting up Supabase Storage for avatar uploads</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Setting up storage...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-center text-green-600">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <p className="text-center text-red-600">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status !== "loading" && (
            <Button onClick={setupStorage} disabled={status === "loading"}>
              {status === "success" ? "Run Setup Again" : "Retry Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// Add dynamic export to prevent prerendering
export const dynamic = "force-dynamic"
