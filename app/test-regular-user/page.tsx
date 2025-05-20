"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Shield } from "lucide-react"
import { verifyRlsPolicies } from "@/lib/verify-rls-policies"
import { testRegularUserAccess } from "@/lib/test-admin-controls"

export default function TestRegularUserPage() {
  const [rlsResult, setRlsResult] = useState<{
    success?: boolean
    message: string
    itemCount?: number
    userCount?: number
    itemsByUser?: Record<string, number>
  } | null>(null)

  const [adminAccessResult, setAdminAccessResult] = useState<{
    canAccess?: boolean
    message: string
  } | null>(null)

  const [loading, setLoading] = useState<string | null>(null)

  const runRlsTest = async () => {
    setLoading("rls")
    try {
      const result = await verifyRlsPolicies()
      setRlsResult(result)
    } catch (error) {
      setRlsResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(null)
    }
  }

  const runAdminAccessTest = async () => {
    setLoading("adminAccess")
    try {
      const result = await testRegularUserAccess()
      setAdminAccessResult(result)
    } catch (error) {
      setAdminAccessResult({
        canAccess: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Regular User Security Tests</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>RLS Policy Test</CardTitle>
            <CardDescription>Verifies that RLS policies are restricting data access correctly</CardDescription>
          </CardHeader>
          <CardContent>
            {rlsResult && (
              <>
                <Alert variant={rlsResult.success ? "default" : "destructive"} className="mb-4">
                  {rlsResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertTitle>{rlsResult.success ? "RLS Policies Working" : "RLS Policy Issue Detected"}</AlertTitle>
                  <AlertDescription>{rlsResult.message}</AlertDescription>
                </Alert>

                {rlsResult.itemCount !== undefined && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Items visible to you:</span>
                      <Badge variant="outline">{rlsResult.itemCount}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Different users' data visible:</span>
                      <Badge variant="outline">{rlsResult.userCount}</Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runRlsTest} disabled={loading === "rls"}>
              {loading === "rls" ? "Testing..." : "Run RLS Test"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Access Test</CardTitle>
            <CardDescription>Tests if a regular user can access admin routes</CardDescription>
          </CardHeader>
          <CardContent>
            {adminAccessResult && (
              <Alert variant={adminAccessResult.canAccess ? "destructive" : "default"} className="mb-4">
                {adminAccessResult.canAccess ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {adminAccessResult.canAccess ? "Security Issue Detected" : "Security Confirmed"}
                </AlertTitle>
                <AlertDescription>{adminAccessResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runAdminAccessTest} disabled={loading === "adminAccess"}>
              {loading === "adminAccess" ? "Testing..." : "Run Admin Access Test"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
