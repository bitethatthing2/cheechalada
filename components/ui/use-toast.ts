// This is a simplified version of the toast component
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  sonnerToast(title || description, {
    description: title ? description : undefined,
    className: variant === "destructive" ? "bg-red-100" : undefined,
  })
}

// Export the toast function directly to avoid the t.json error
