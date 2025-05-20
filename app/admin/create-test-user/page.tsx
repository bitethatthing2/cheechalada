import { Suspense } from "react"
import CreateTestUser from "@/scripts/create-test-user"

// Add dynamic export to prevent prerendering
export const dynamic = "force-dynamic"

export default function CreateTestUserPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTestUser />
    </Suspense>
  )
}
