"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useSwipeGesture } from "@/hooks/use-swipe-gesture"

interface SwipeGestureContextType {
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
}

const SwipeGestureContext = createContext<SwipeGestureContextType>({
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
})

export function useSwipeGestureContext() {
  return useContext(SwipeGestureContext)
}

interface SwipeGestureProviderProps {
  children: React.ReactNode
}

export function SwipeGestureProvider({ children }: SwipeGestureProviderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
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

  // Set up swipe gestures
  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !isDrawerOpen) {
        setIsDrawerOpen(true)
      }
    },
    onSwipeLeft: () => {
      if (isMobile && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    },
  })

  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen)

  return (
    <SwipeGestureContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
      }}
    >
      {children}
    </SwipeGestureContext.Provider>
  )
}
