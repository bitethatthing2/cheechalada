"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from "lucide-react"
import {
  testAdminAccess,
  testCrossUserDataAccess,
  testModifyOtherUserData,
  testRegularUserAccess,
} from "@/lib/test-admin-controls"

export default function TestAdminControlsPage() {
  const [adminAccessResult, setAdminAccessResult] = useState<{ isAdmin?: boolean; message: string } | null>(null)
  const [dataAccessResult, setDataAccessResult] = useState<{
    success?: boolean
    message: string
    user1Items?: number
    user2Items?: number
    totalItems?: number
  } | null>(null)
  const [modifyResult, setModifyResult] = useState<{ success?: boolean; message: string; itemId?: string } | null>(null)
  const [regularUserResult, setRegularUserResult] = useState<{ canAccess?: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const runAdminAccessTest = async () => {
    setLoading("adminAccess")
    try {
      const result = await testAdminAccess()
      setAdminAccessResult(result)
    } catch (error) {
      setAdminAccessResult({
        isAdmin: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(null)
    }
  }

  const runDataAccessTest = async () => {
    setLoading("dataAccess")
    try {
      const result = await testCrossUserDataAccess()
      setDataAccessResult(result)
    } catch (error) {
      setDataAccessResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(null)
    }
  }

  const runModifyTest = async () => {
    setLoading("modify")
    try {
      const result = await testModifyOtherUserData()
      setModifyResult(result)
    } catch (error) {
      setModifyResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(null)
    }
  }

  const runRegularUserTest = async () => {
    setLoading("regularUser")
    try {
      const result = await testRegularUserAccess()
      setRegularUserResult(result)
    } catch (error) {
      setRegularUserResult({
        canAccess: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(null)
    }
  }

  const runAllTests = async () => {
    await runAdminAccessTest()
    await runDataAccessTest()
    await runModifyTest()
    // Skip regular user test as it should be run separately
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Admin Controls Test Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Test</CardTitle>
            <CardDescription>Tests if the current user has admin access to protected routes</CardDescription>
          </CardHeader>
          <CardContent>
            {adminAccessResult && (
              <Alert variant={adminAccessResult.isAdmin ? "default" : "destructive"} className="mb-4">
                {adminAccessResult.isAdmin ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{adminAccessResult.isAdmin ? "Admin Access Confirmed" : "Admin Access Denied"}</AlertTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Cross-User Data Access Test</CardTitle>
            <CardDescription>Tests if admin can see data from all users</CardDescription>
          </CardHeader>
          <CardContent>
            {dataAccessResult && (
              <>
                <Alert variant={dataAccessResult.success ? "default" : "destructive"} className="mb-4">
                  {dataAccessResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>
                    {dataAccessResult.success ? "Cross-User Access Confirmed" : "Cross-User Access Failed"}
                  </AlertTitle>
                  <AlertDescription>{dataAccessResult.message}</AlertDescription>
                </Alert>

                {dataAccessResult.success && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>User 1 Items:</span>
                      <Badge variant="outline">{dataAccessResult.user1Items}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>User 2 Items:</span>
                      <Badge variant="outline">{dataAccessResult.user2Items}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Items:</span>
                      <Badge variant="outline">{dataAccessResult.totalItems}</Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runDataAccessTest} disabled={loading === "dataAccess"}>
              {loading === "dataAccess" ? "Testing..." : "Run Data Access Test"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modify Other User's Data Test</CardTitle>
            <CardDescription>Tests if admin can modify data owned by other users</CardDescription>
          </CardHeader>
          <CardContent>
            {modifyResult && (
              <Alert variant={modifyResult.success ? "default" : "destructive"} className="mb-4">
                {modifyResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{modifyResult.success ? "Modify Access Confirmed" : "Modify Access Failed"}</AlertTitle>
                <AlertDescription>{modifyResult.message}</AlertDescription>
                {modifyResult.itemId && (
                  <div className="mt-2">
                    <Badge variant="outline">Item ID: {modifyResult.itemId}</Badge>
                  </div>
                )}
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runModifyTest} disabled={loading === "modify"}>
              {loading === "modify" ? "Testing..." : "Run Modify Test"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regular User Access Test</CardTitle>
            <CardDescription>Tests if a regular user can access admin routes (run as non-admin)</CardDescription>
          </CardHeader>
          <CardContent>
            {regularUserResult && (
              <Alert variant={regularUserResult.canAccess ? "destructive" : "default"} className="mb-4">
                {regularUserResult.canAccess ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {regularUserResult.canAccess ? "Security Issue Detected" : "Security Confirmed"}
                </AlertTitle>
                <AlertDescription>{regularUserResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runRegularUserTest} disabled={loading === "regularUser"}>
              {loading === "regularUser" ? "Testing..." : "Run Regular User Test"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Run All Tests</CardTitle>
            <CardDescription>Run all admin tests at once</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This will run all tests except the Regular User Access Test, which should be run separately as a non-admin
              user.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={runAllTests} disabled={loading !== null}>
              {loading ? "Testing..." : "Run All Tests"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
