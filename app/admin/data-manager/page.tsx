"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Edit, Database, AlertTriangle } from "lucide-react"
import { isCurrentUserAdmin } from "@/lib/supabase/admin-utils"

interface SecurityTestItem {
  id: string
  name: string
  user_id: string
  created_at: string
  profiles?: {
    email: string
    username: string
  }
}

interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export default function AdminDataManagerPage() {
  const [items, setItems] = useState<SecurityTestItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<SecurityTestItem | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isCurrentUserAdmin()
        setIsAdmin(adminStatus)

        if (!adminStatus) {
          router.push("/unauthorized")
          return
        }

        // Fetch data
        fetchItems()
        fetchUsers()
      } catch (err) {
        console.error("Error checking admin status:", err)
        setError("Failed to verify admin status.")
      }
    }

    checkAdminStatus()
  }, [router])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/security-test")

      if (!response.ok) {
        throw new Error("Failed to fetch items")
      }

      const data = await response.json()
      setItems(data.items || [])
    } catch (err) {
      console.error("Error fetching items:", err)
      setError("Failed to load items.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users.")
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return

    try {
      const response = await fetch("/api/admin/security-test", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem.id,
          name: editingItem.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update item")
      }

      // Refresh the items
      fetchItems()
      setEditingItem(null)
    } catch (err) {
      console.error("Error updating item:", err)
      setError("Failed to update item.")
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/security-test?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      // Refresh the items
      fetchItems()
    } catch (err) {
      console.error("Error deleting item:", err)
      setError("Failed to delete item.")
    }
  }

  if (!isAdmin) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have permission to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Admin Data Manager</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="items">
        <TabsList className="mb-4">
          <TabsTrigger value="items">Security Test Items</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>All Security Test Items</CardTitle>
              <CardDescription>
                As an admin, you can view and manage items from all users, bypassing RLS policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No items found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
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
                        <TableCell>{item.profiles?.email || item.user_id}</TableCell>
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
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this item? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => {}}>
                                      Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleDeleteItem(item.id)}>
                                      Delete
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View all users registered in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No users found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Admin Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {user.email === "admin@example.com" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              User
                            </span>
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
      </Tabs>
    </div>
  )
}

// Add dynamic export to prevent prerendering
export const dynamic = "force-dynamic"
