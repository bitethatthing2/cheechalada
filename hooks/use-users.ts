"use client"

import { useState } from "react"

// Mock data for demonstration
const MOCK_USERS = {
  "1": {
    id: "1",
    name: "Sarah Johnson",
    role: "manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  "2": {
    id: "2",
    name: "Mike Chen",
    role: "kitchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
  },
  "3": {
    id: "3",
    name: "Emily Rodriguez",
    role: "server",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
  },
  "4": {
    id: "4",
    name: "David Kim",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
  },
  "5": {
    id: "5",
    name: "You",
    role: "customer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
  },
}

export function useUsers() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [currentUser, setCurrentUser] = useState(MOCK_USERS["5"])

  return {
    users,
    currentUser,
  }
}
