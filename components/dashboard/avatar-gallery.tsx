"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorPicker } from "@/components/ui/color-picker"
import { toast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw } from "lucide-react"

interface AvatarGalleryProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onAvatarSelect: (url: string) => void
}

// Avatar style options with their customizable properties
const avatarStyles = [
  {
    id: "avataaars",
    name: "People",
    colorOptions: [
      { name: "backgroundColor", label: "Background" },
      { name: "hairColor", label: "Hair" },
      { name: "skinColor", label: "Skin" },
      { name: "clothesColor", label: "Clothes" },
    ],
  },
  {
    id: "bottts",
    name: "Robots",
    colorOptions: [
      { name: "backgroundColor", label: "Background" },
      { name: "primaryColor", label: "Primary" },
      { name: "secondaryColor", label: "Secondary" },
    ],
  },
  {
    id: "pixel-art",
    name: "Pixel Art",
    colorOptions: [
      { name: "backgroundColor", label: "Background" },
      { name: "primaryColor", label: "Primary" },
      { name: "secondaryColor", label: "Secondary" },
    ],
  },
  {
    id: "identicon",
    name: "Abstract",
    colorOptions: [
      { name: "backgroundColor", label: "Background" },
      { name: "primaryColor", label: "Primary" },
    ],
  },
  {
    id: "initials",
    name: "Initials",
    colorOptions: [
      { name: "backgroundColor", label: "Background" },
      { name: "textColor", label: "Text" },
    ],
  },
]

// Generate seeds for variety
const generateSeeds = (count: number) => {
  const seeds = []
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789"

  for (let i = 0; i < count; i++) {
    let seed = ""
    for (let j = 0; j < 8; j++) {
      seed += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    seeds.push(seed)
  }

  return seeds
}

// Default colors for each style
const defaultColors = {
  avataaars: {
    backgroundColor: "#6A4C93",
    hairColor: "#4A312C",
    skinColor: "#F8D25C",
    clothesColor: "#1982C4",
  },
  bottts: {
    backgroundColor: "#1982C4",
    primaryColor: "#8AC926",
    secondaryColor: "#FF6B6B",
  },
  "pixel-art": {
    backgroundColor: "#6A4C93",
    primaryColor: "#FF9E7D",
    secondaryColor: "#FFCA3A",
  },
  identicon: {
    backgroundColor: "#1982C4",
    primaryColor: "#8AC926",
  },
  initials: {
    backgroundColor: "#6A4C93",
    textColor: "#FFFFFF",
  },
}

export function AvatarGallery({ isOpen, onClose, userId, onAvatarSelect }: AvatarGalleryProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(avatarStyles[0].id)
  const [colors, setColors] = useState({ ...defaultColors })
  const [seeds, setSeeds] = useState(generateSeeds(12))

  // Reset colors when changing tabs
  useEffect(() => {
    const style = avatarStyles.find((s) => s.id === activeTab)
    if (style) {
      setSelectedSeed(null)
    }
  }, [activeTab])

  const regenerateSeeds = () => {
    setSeeds(generateSeeds(12))
    setSelectedSeed(null)
  }

  const buildAvatarUrl = (style: string, seed: string) => {
    const styleColors = colors[style as keyof typeof colors]
    let url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`

    // Add color parameters
    Object.entries(styleColors).forEach(([key, value]) => {
      // Remove # from hex color
      const colorValue = value.replace("#", "")
      url += `&${key}=${colorValue}`
    })

    return url
  }

  const handleColorChange = (colorName: string, colorValue: string) => {
    setColors((prevColors) => ({
      ...prevColors,
      [activeTab]: {
        ...prevColors[activeTab as keyof typeof prevColors],
        [colorName]: colorValue,
      },
    }))
  }

  const handleSelectAvatar = async () => {
    if (!selectedSeed) return

    setIsLoading(true)
    try {
      const avatarUrl = buildAvatarUrl(activeTab, selectedSeed)

      // Update profile with selected avatar
      const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId)

      if (error) throw error

      onAvatarSelect(avatarUrl)
      toast({
        title: "Avatar updated",
        description: "Your profile image has been updated successfully",
      })

      router.refresh()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentStyle = avatarStyles.find((style) => style.id === activeTab)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose an Avatar</DialogTitle>
          <DialogDescription>Select and customize a preset avatar for your profile</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {avatarStyles.map((style) => (
              <TabsTrigger key={style.id} value={style.id}>
                {style.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {avatarStyles.map((style) => (
            <TabsContent key={style.id} value={style.id} className="mt-4">
              <div className="flex flex-col gap-4">
                {/* Color customization options */}
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex flex-wrap gap-4 mb-4">
                    {style.colorOptions.map((option) => (
                      <ColorPicker
                        key={option.name}
                        label={option.label}
                        color={
                          colors[style.id as keyof typeof colors][
                            option.name as keyof (typeof defaultColors)[typeof style.id]
                          ]
                        }
                        onChange={(color) => handleColorChange(option.name, color)}
                      />
                    ))}
                  </div>

                  {/* Preview of selected avatar with current colors */}
                  {selectedSeed && (
                    <div className="flex justify-center py-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage
                          src={buildAvatarUrl(style.id, selectedSeed) || "/placeholder.svg"}
                          alt={`${style.name} avatar preview`}
                        />
                        <AvatarFallback>...</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                {/* Avatar grid */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Select a design:</h3>
                  <Button variant="ghost" size="sm" onClick={regenerateSeeds} className="h-8 px-2">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh Options
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                  {seeds.map((seed) => {
                    const avatarUrl = buildAvatarUrl(style.id, seed)
                    return (
                      <div
                        key={`${style.id}-${seed}`}
                        className={`cursor-pointer rounded-lg p-2 transition-all hover:bg-accent ${
                          selectedSeed === seed ? "bg-accent ring-2 ring-primary ring-offset-2" : ""
                        }`}
                        onClick={() => setSelectedSeed(seed)}
                      >
                        <Avatar className="h-16 w-16 mx-auto">
                          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={`${style.name} avatar`} />
                          <AvatarFallback>...</AvatarFallback>
                        </Avatar>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelectAvatar} disabled={!selectedSeed || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Select Avatar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
