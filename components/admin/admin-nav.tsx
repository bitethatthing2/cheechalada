"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Shield, Database, MessageSquare } from "lucide-react"

const items = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/data-manager",
    icon: Users,
  },
  {
    title: "Chat Rooms",
    href: "/admin/chat-rooms",
    icon: MessageSquare,
  },
  {
    title: "Security Audit",
    href: "/admin/security-audit",
    icon: Shield,
  },
  {
    title: "Security Test",
    href: "/admin/security-test",
    icon: Shield,
  },
  {
    title: "Storage Setup",
    href: "/admin/setup-storage",
    icon: Database,
  },
  {
    title: "Create Test User",
    href: "/admin/create-test-user",
    icon: Users,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 px-2 py-4">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent" : "transparent",
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
