"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createArea, updateArea } from "@/lib/actions/areas"
import type { Area } from "@/lib/db/schema"

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
]

interface AreaFormProps {
  area?: Area
  onSuccess?: () => void
}

export function AreaForm({ area, onSuccess }: AreaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(area?.name ?? "")
  const [description, setDescription] = useState(area?.description ?? "")
  const [color, setColor] = useState(area?.color ?? PRESET_COLORS[0])
  const [expectedHoursPerWeek, setExpectedHoursPerWeek] = useState(area?.expectedHoursPerWeek ?? 10)

  const isEditing = !!area

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    setIsLoading(true)
    try {
      if (isEditing) {
        await updateArea(area.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          expectedHoursPerWeek,
        })
        toast.success("Area updated successfully")
      } else {
        await createArea({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          expectedHoursPerWeek,
        })
        toast.success("Area created successfully")
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(isEditing ? "Failed to update area" : "Failed to create area")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Fractional CTO"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this area..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              onClick={() => setColor(presetColor)}
              className={`size-8 rounded-full transition-all ${
                color === presetColor ? "ring-2 ring-offset-2 ring-primary" : "hover:scale-110"
              }`}
              style={{ backgroundColor: presetColor }}
              aria-label={`Select color ${presetColor}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedHours">Expected Hours per Week</Label>
        <Input
          id="expectedHours"
          type="number"
          min={0}
          max={168}
          value={expectedHoursPerWeek}
          onChange={(e) => setExpectedHoursPerWeek(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">Set your weekly time allocation goal for this area</p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Area" : "Create Area"}
        </Button>
      </div>
    </form>
  )
}
