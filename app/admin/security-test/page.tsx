"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit, Plus, CheckCircle2, XCircle, Shield, AlertTriangle } from "lucide-react"
import {
  getSecurityTestItems,
  addSecurityTestItem,
  updateSecurityTestItem,
  deleteSecurityTestItem,
  testRlsPolicies,
  type SecurityTestItem,
} from "@/lib/supabase/security-test"
import { createClient } from "@/lib/supabase/client-browser"

export default function SecurityTestPage() {
  const [items, setItems] = useState<SecurityTestItem[]>([])
  const [newItemName, setNewItemName] = useState("")
  const [editingItem, setEditingItem] = useState<SecurityTestItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getSecurityTestItems()
        setItems(data)
      } catch (err) {
        setError("Failed to load items. Please check your connection.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const fetchCurrentUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setCurrentUser(data.user)
    }

    fetchItems()
    fetchCurrentUser()
  }, [])

  const handleAddItem = async () => {
    if (!newItemName.trim()) return

    try {
      setLoading(true)
      const newItem = await addSecurityTestItem(newItemName)
      setItems([newItem, ...items])
      setNewItemName("")
    } catch (err) {
      setError("Failed to add item. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return

    try {
      setLoading(true)
      const updatedItem = await updateSecurityTestItem(editingItem.id, editingItem.name)
      setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
      setEditingItem(null)
    } catch (err) {
      setError("Failed to update item. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      setLoading(true)
      await deleteSecurityTestItem(id)
      setItems(items.filter((item) => item.id !== id))
    } catch (err) {
      setError("Failed to delete item. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const runSecurityTest = async () => {
    if (!currentUser) return

    try {
      setTestLoading(true)
      const results = await testRlsPolicies(currentUser)
      setTestResults(results)
    } catch (err) {
      console.error("Error running security test:", err)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Security Test Dashboard</h1>
      </div>

      <Tabs defaultValue="items">
        <TabsList className="mb-4">
          <TabsTrigger value="items">Manage Items</TabsTrigger>
          <TabsTrigger value="test">Test RLS Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
              <CardDescription>
                Create a new item in the security_test_table. RLS will automatically set your user_id.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>
                <Button className="self-end" onClick={handleAddItem} disabled={loading || !newItemName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your Items</CardTitle>
              <CardDescription>
                Due to RLS policies, you can only see items where user_id matches your ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No items found. Add your first item above.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {editingItem?.id === item.id ? (
                            <Input
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            />
                          ) : (
                            item.name
                          )}
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {editingItem?.id === item.id ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateItem}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => setEditingItem(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test RLS Policies</CardTitle>
              <CardDescription>
                Run tests to verify that Row Level Security policies are working correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runSecurityTest} disabled={testLoading || !currentUser} className="mb-6">
                {testLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></span>
                    Running Tests...
                  </>
                ) : (
                  <>Run Security Tests</>
                )}
              </Button>

              {testResults && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">SELECT Policy Test</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {testResults.policiesWorking.selectPolicy ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span>
                            {testResults.policiesWorking.selectPolicy ? "Working correctly" : "Not working correctly"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          You can see {testResults.ownItemsCount} of your own items.
                          {testResults.otherItemsCount === 0
                            ? " You cannot see other users' items."
                            : ` WARNING: You can see ${testResults.otherItemsCount} items from other users!`}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">UPDATE Policy Test</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {testResults.policiesWorking.updatePolicy ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span>
                            {testResults.policiesWorking.updatePolicy ? "Working correctly" : "Not working correctly"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {testResults.updateError
                            ? `Update attempt was correctly blocked: "${testResults.updateError}"`
                            : "WARNING: You might be able to update other users' items!"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert
                    className={
                      testResults.policiesWorking.selectPolicy && testResults.policiesWorking.updatePolicy
                        ? "border-green-500"
                        : "border-red-500"
                    }
                  >
                    <AlertTitle>
                      {testResults.policiesWorking.selectPolicy && testResults.policiesWorking.updatePolicy
                        ? "RLS Policies Working Correctly"
                        : "RLS Policy Issues Detected"}
                    </AlertTitle>
                    <AlertDescription>
                      {testResults.policiesWorking.selectPolicy && testResults.policiesWorking.updatePolicy
                        ? "Your Row Level Security policies are properly configured and working as expected."
                        : "There are issues with your RLS policies. Please check the security audit dashboard for details."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/admin/security-audit")}>
                Go to Security Audit Dashboard
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Add dynamic export to prevent prerendering
export const dynamic = "force-dynamic"
