import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldAlert } from "lucide-react"

interface SecurityStatusBadgeProps {
  isSecure: boolean
  size?: "sm" | "md" | "lg"
}

export function SecurityStatusBadge({ isSecure, size = "md" }: SecurityStatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0 px-1",
    md: "text-sm py-0.5 px-2",
    lg: "text-base py-1 px-3",
  }

  if (isSecure) {
    return (
      <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 ${sizeClasses[size]}`}>
        <ShieldCheck className="h-3 w-3 mr-1" />
        Secured
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 ${sizeClasses[size]}`}>
      <ShieldAlert className="h-3 w-3 mr-1" />
      Vulnerable
    </Badge>
  )
}
