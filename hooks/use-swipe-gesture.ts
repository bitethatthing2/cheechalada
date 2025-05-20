"use client"

import { useState, useEffect, useCallback } from "react"

interface UseSwipeGestureProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  edgeSize?: number
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 50, edgeSize = 20 }: UseSwipeGestureProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  // Reset touch states
  const resetTouchState = useCallback(() => {
    setTouchStart(null)
    setTouchEnd(null)
    setTouchStartY(null)
    setIsSwiping(false)
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Only detect swipes from the left edge to open the drawer
      if (!isSwiping && e.touches[0].clientX <= edgeSize) {
        setTouchStart(e.touches[0].clientX)
        setTouchStartY(e.touches[0].clientY)
        setIsSwiping(true)
      } else if (isSwiping) {
        setTouchStart(e.touches[0].clientX)
        setTouchStartY(e.touches[0].clientY)
      }
    },
    [edgeSize, isSwiping],
  )

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStart) return

      setTouchEnd(e.touches[0].clientX)

      // If we're swiping more vertically than horizontally, cancel the swipe
      if (touchStartY !== null) {
        const verticalDistance = Math.abs(e.touches[0].clientY - touchStartY)
        const horizontalDistance = Math.abs(e.touches[0].clientX - touchStart)

        if (verticalDistance > horizontalDistance) {
          resetTouchState()
          return
        }
      }
    },
    [touchStart, touchStartY, resetTouchState],
  )

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    // Calculate swipe distance
    const distance = touchEnd - touchStart
    const isLeftSwipe = distance < -threshold
    const isRightSwipe = distance > threshold

    // Execute swipe callbacks
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }

    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }

    // Reset touch states
    resetTouchState()
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, resetTouchState])

  // Add and remove event listeners
  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])
}
