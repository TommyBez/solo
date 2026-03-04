'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createArea, updateArea } from '@/lib/actions/areas'
import { DEFAULT_EXPECTED_HOURS_PER_WEEK } from '@/lib/constants/areas'

// Partial area type for form - only fields needed for editing
interface AreaFormData {
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

const areaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  color: z.string(),
  expectedHoursPerWeek: z.coerce.number().min(0).max(168),
})

type AreaFormValues = z.infer<typeof areaSchema>

interface AreaFormProps {
  area?: AreaFormData
  onSuccess?: () => void
}

export function AreaForm({ area, onSuccess }: AreaFormProps) {
  const router = useRouter()
  const isEditing = !!area
  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      name: area?.name ?? '',
      description: area?.description ?? '',
      color: area?.color ?? PRESET_COLORS[0],
      expectedHoursPerWeek:
        area?.expectedHoursPerWeek ?? DEFAULT_EXPECTED_HOURS_PER_WEEK,
    },
  })
  const isLoading = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const formData = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        color: values.color,
        expectedHoursPerWeek: values.expectedHoursPerWeek,
      }
      if (isEditing) {
        await updateArea(area.id, formData)
        toast.success('Area updated successfully')
      } else {
        await createArea(formData)
        toast.success('Area created successfully')
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(isEditing ? 'Failed to update area' : 'Failed to create area')
    }
  })

  let buttonText = 'Create Area'
  if (isLoading) {
    buttonText = 'Saving...'
  } else if (isEditing) {
    buttonText = 'Update Area'
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="e.g., Fractional CTO"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  disabled={isLoading}
                  placeholder="Brief description of this area..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      aria-label={`Select color ${presetColor}`}
                      className={`size-8 rounded-full transition-all ${
                        field.value === presetColor
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                      key={presetColor}
                      onClick={() => field.onChange(presetColor)}
                      style={{ backgroundColor: presetColor }}
                      type="button"
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedHoursPerWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Hours per Week</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  max={168}
                  min={0}
                  type="number"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Set your weekly time allocation goal for this area
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button disabled={isLoading} type="submit">
            {buttonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}
