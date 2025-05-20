"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCw, ZoomIn } from "lucide-react"

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropModal({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen && imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, 1))
    }
  }, [isOpen, imageSrc])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleScaleChange = (value: number[]) => {
    setScale(value[0])
  }

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return
    }

    const image = imgRef.current
    const canvas = canvasRef.current
    const crop = completedCrop

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }

    // Set canvas size to desired output size
    const pixelRatio = window.devicePixelRatio
    canvas.width = crop.width * scaleX * pixelRatio
    canvas.height = crop.height * scaleY * pixelRatio

    // Scale the canvas context for high DPI displays
    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = "high"

    // Calculate the center of the canvas
    const centerX = canvas.width / (2 * pixelRatio)
    const centerY = canvas.height / (2 * pixelRatio)

    // Save the current context state
    ctx.save()

    // Translate to the center, rotate, and scale
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)
    ctx.translate(-centerX, -centerY)

    // Draw the image with crop
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    )

    // Restore the context state
    ctx.restore()

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Canvas is empty")
          return
        }
        onCropComplete(blob)
        onClose()
      },
      "image/jpeg",
      0.95,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>Adjust your profile picture. Drag to reposition.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative max-h-[300px] overflow-hidden rounded-lg">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                src={imageSrc || "/placeholder.svg"}
                alt="Crop me"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  maxHeight: "300px",
                  width: "auto",
                }}
                onLoad={onImageLoad}
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>

          <div className="flex w-full items-center gap-4">
            <ZoomIn className="h-4 w-4" />
            <Slider
              defaultValue={[1]}
              min={0.5}
              max={2}
              step={0.01}
              value={[scale]}
              onValueChange={handleScaleChange}
              className="w-full"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="mr-2 h-4 w-4" />
            Rotate
          </Button>

          {/* Hidden canvas for processing the cropped image */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
