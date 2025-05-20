"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

export function SwipeIndicator() {
  const [visible, setVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Hide the indicator after a few seconds
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 5000)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [isMobile])

  if (!isMobile || !visible) return null

  return (
    <div className="fixed left-0 top-1/2 z-50 -translate-y-1/2 animate-pulse">
      <div
        className={cn(
          "flex items-center justify-center bg-primary/20 text-primary rounded-r-full p-2",
          "animate-[swipe_1.5s_ease-in-out_infinite]",
        )}
      >
        <ChevronRight className="h-6 w-6" />
      </div>
    </div>
  )
}

// Add this to your globals.css
// @keyframes swipe {
//   0% { transform: translateX(-50%); }
//   50% { transform: translateX(10px); }
//   100% { transform: translateX(-50%); }
// }
