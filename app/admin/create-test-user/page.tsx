import { Suspense } from "react"
import CreateTestUser from "@/scripts/create-test-user"

// Fix: Use 'force-dynamic' with a hyphen instead of 'force_dynamic' with an underscore
export const dynamic = "force-dynamic"

export default function CreateTestUserPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTestUser />
    </Suspense>
  )
}
