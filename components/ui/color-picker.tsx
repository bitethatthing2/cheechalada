"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  label: string
}

const predefinedColors = [
  "#FF6B6B", // Red
  "#FF9E7D", // Coral
  "#FFCA3A", // Yellow
  "#8AC926", // Green
  "#1982C4", // Blue
  "#6A4C93", // Purple
  "#F15BB5", // Pink
  "#00BBF9", // Cyan
  "#9B5DE5", // Violet
  "#F8F9FA", // White
  "#CED4DA", // Light Gray
  "#6C757D", // Gray
  "#495057", // Dark Gray
  "#212529", // Black
]

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(color)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedColor(color)
  }, [color])

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor)
    onChange(newColor)
    setIsOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setSelectedColor(newColor)
    onChange(newColor)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{label}:</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-8 h-8 p-0 rounded-md border"
            style={{ backgroundColor: selectedColor }}
            aria-label={`Select ${label.toLowerCase()} color`}
          >
            <span className="sr-only">Open color picker</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 gap-1">
              {predefinedColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className={cn(
                    "w-6 h-6 rounded-md border border-gray-200 cursor-pointer",
                    selectedColor === presetColor && "ring-2 ring-primary ring-offset-2",
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorChange(presetColor)}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                ref={inputRef}
                type="color"
                value={selectedColor}
                onChange={handleCustomColorChange}
                className="w-8 h-8 p-0 border-0"
                id="custom-color"
              />
              <label htmlFor="custom-color" className="text-xs text-muted-foreground">
                Custom color
              </label>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
