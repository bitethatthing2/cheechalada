import type { ReactNode } from "react"

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <div className="h-[100dvh] w-full overflow-hidden">{children}</div>
}
