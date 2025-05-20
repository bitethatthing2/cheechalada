"use client"

import { useEffect } from "react"

interface KeyboardShortcutsProps {
  onSearchOpen: () => void
}

export function KeyboardShortcuts({ onSearchOpen }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        onSearchOpen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onSearchOpen])

  return null
}
