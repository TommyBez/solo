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
import {
  DEFAULT_EXPECTED_HOURS_PER_WEEK,
  EMPTY_CLIENTS,
} from '@/lib/constants/areas'
import type { Client } from '@/lib/db/schema'

// Partial area type for form - only fields needed for editing
interface AreaFormData {
  clientId: number | null
  color: string
  description: string | null
  expectedHoursPerWeek: number
  id: number
  name: string
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

interface AreaFormProps {
  area?: AreaFormData
  clients?: Client[]
  onSuccess?: () => void
}

interface AreaFormState {
  clientId: string
  color: string
  description: string
  expectedHoursPerWeek: number
  name: string
}

export function AreaForm({
  area,
  clients = EMPTY_CLIENTS,
  onSuccess,
}: AreaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<AreaFormState>(() => ({
    name: area?.name ?? '',
    description: area?.description ?? '',
    color: area?.color ?? PRESET_COLORS[0],
    expectedHoursPerWeek:
      area?.expectedHoursPerWeek ?? DEFAULT_EXPECTED_HOURS_PER_WEEK,
    clientId: area?.clientId?.toString() ?? '',
  }))

  const isEditing = !!area

  function getFormData() {
    return {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      color: form.color,
      expectedHoursPerWeek: form.expectedHoursPerWeek,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsLoading(true)
    try {
      const formData = getFormData()
      if (isEditing) {
        await updateArea(area.id, {
          ...formData,
          clientId: form.clientId ? Number(form.clientId) : null,
        })
        toast.success('Area updated successfully')
      } else {
        await createArea({
          ...formData,
          clientId: form.clientId ? Number(form.clientId) : undefined,
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
          onChange={(e) => {
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }}
          placeholder="e.g., Fractional CTO"
          required
          value={form.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          onChange={(e) => {
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }}
          placeholder="Brief description of this area..."
          rows={3}
          value={form.description}
        />
      </div>

      {clients.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="client">Client (optional)</Label>
          <Select
            onValueChange={(clientId) => {
              setForm((prev) => ({ ...prev, clientId }))
            }}
            value={form.clientId}
          >
            <SelectTrigger>
              <SelectValue placeholder="No client assigned">
                {form.clientId ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    {clients.find((c) => c.id.toString() === form.clientId)
                      ?.name ?? 'Unknown client'}
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
            Link this area to a client for better organization
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
                form.color === presetColor
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'hover:scale-110'
              }`}
              key={presetColor}
              onClick={() => {
                setForm((prev) => ({ ...prev, color: presetColor }))
              }}
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
          onChange={(e) => {
            setForm((prev) => ({
              ...prev,
              expectedHoursPerWeek: Number(e.target.value),
            }))
          }}
          type="number"
          value={form.expectedHoursPerWeek}
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
