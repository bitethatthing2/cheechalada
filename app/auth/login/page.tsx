import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { Loader2 } from "lucide-react"

// Prevent static prerendering of this page
export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-2 p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading login form...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
