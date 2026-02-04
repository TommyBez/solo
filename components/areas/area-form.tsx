'use client'

import { Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createArea, updateArea } from '@/lib/actions/areas'
import type { Client } from '@/lib/db/schema'

// Partial area type for form - only fields needed for editing
type AreaFormData = {
  id: number
  name: string
  description: string | null
  color: string
  expectedHoursPerWeek: number
  clientId: number | null
}

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
]

type AreaFormProps = {
  area?: AreaFormData
  clients?: Client[]
  onSuccess?: () => void
}

export function AreaForm({ area, clients = [], onSuccess }: AreaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(area?.name ?? '')
  const [description, setDescription] = useState(area?.description ?? '')
  const [color, setColor] = useState(area?.color ?? PRESET_COLORS[0])
  const [expectedHoursPerWeek, setExpectedHoursPerWeek] = useState(
    area?.expectedHoursPerWeek ?? 10,
  )
  const [clientId, setClientId] = useState<string>(
    area?.clientId?.toString() ?? '',
  )

  const isEditing = !!area

  function getFormData() {
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      expectedHoursPerWeek,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsLoading(true)
    try {
      const formData = getFormData()
      if (isEditing) {
        await updateArea(area.id, {
          ...formData,
          clientId: clientId ? Number(clientId) : null,
        })
        toast.success('Area updated successfully')
      } else {
        await createArea({
          ...formData,
          clientId: clientId ? Number(clientId) : undefined,
        })
        toast.success('Area created successfully')
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(isEditing ? 'Failed to update area' : 'Failed to create area')
    } finally {
      setIsLoading(false)
    }
  }

  let buttonText = 'Create Area'
  if (isLoading) {
    buttonText = 'Saving...'
  } else if (isEditing) {
    buttonText = 'Update Area'
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Fractional CTO"
          required
          value={name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this area..."
          rows={3}
          value={description}
        />
      </div>

      {clients.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="client">Client (optional)</Label>
          <Select onValueChange={setClientId} value={clientId}>
            <SelectTrigger>
              <SelectValue placeholder="No client assigned">
                {clientId ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    {clients.find((c) => c.id.toString() === clientId)?.name}
                  </div>
                ) : (
                  'No client assigned'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No client assigned</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    {client.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Link this area to a client for invoicing
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              aria-label={`Select color ${presetColor}`}
              className={`size-8 rounded-full transition-all ${
                color === presetColor
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'hover:scale-110'
              }`}
              key={presetColor}
              onClick={() => setColor(presetColor)}
              style={{ backgroundColor: presetColor }}
              type="button"
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedHours">Expected Hours per Week</Label>
        <Input
          id="expectedHours"
          max={168}
          min={0}
          onChange={(e) => setExpectedHoursPerWeek(Number(e.target.value))}
          type="number"
          value={expectedHoursPerWeek}
        />
        <p className="text-muted-foreground text-xs">
          Set your weekly time allocation goal for this area
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button disabled={isLoading} type="submit">
          {buttonText}
        </Button>
      </div>
    </form>
  )
}
