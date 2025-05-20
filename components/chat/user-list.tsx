"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUsers } from "@/hooks/use-users"

export function UserList() {
  const { users } = useUsers()

  // Role-based color mapping
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>
      case "kitchen":
        return (
          <Badge variant="default" className="bg-amber-500">
            Kitchen
          </Badge>
        )
      case "server":
        return (
          <Badge variant="default" className="bg-blue-500">
            Server
          </Badge>
        )
      case "manager":
        return (
          <Badge variant="default" className="bg-purple-500">
            Manager
          </Badge>
        )
      case "customer":
        return (
          <Badge variant="default" className="bg-green-500">
            Customer
          </Badge>
        )
      default:
        return <Badge variant="outline">Guest</Badge>
    }
  }

  return (
    <div className="py-4">
      <h3 className="mb-4 text-lg font-semibold">Participants</h3>
      <div className="space-y-4">
        {Object.values(users).map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="mt-1">{getRoleBadge(user.role)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
