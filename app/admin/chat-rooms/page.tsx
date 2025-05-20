"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import type { ChatRoomSeedResult } from "@/lib/seed-chat-rooms"

export default function ChatRoomsAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ChatRoomSeedResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const seedChatRooms = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/seed-chat-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed chat rooms")
      }

      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Chat Rooms Management</CardTitle>
          <CardDescription>Ensure all required chat rooms exist in the database</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Click the button below to seed the database with required chat rooms. This will create any missing rooms and
            update existing ones if needed.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4 mb-4">
              <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
                <AlertTitle>Seeding Results</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    <li>
                      Created: {result.created.length} rooms{" "}
                      {result.created.length > 0 && `(${result.created.join(", ")})`}
                    </li>
                    <li>
                      Updated: {result.updated.length} rooms{" "}
                      {result.updated.length > 0 && `(${result.updated.join(", ")})`}
                    </li>
                    <li>
                      Existing: {result.existing.length} rooms{" "}
                      {result.existing.length > 0 && `(${result.existing.join(", ")})`}
                    </li>
                    {result.errors.length > 0 && (
                      <li className="text-red-500">
                        Errors: {result.errors.length}
                        <ul className="list-disc pl-5 mt-1">
                          {result.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={seedChatRooms} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Seed Chat Rooms
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Add dynamic export to prevent prerendering
export const dynamic = "force-dynamic"
