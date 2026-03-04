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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createClient, updateClient } from '@/lib/actions/clients'

// Partial client type for form - only fields needed for editing
interface ClientFormData {
  address: string | null
  currency: string
  email: string | null
  hourlyRate: string | null
  id: number
  name: string
  notes: string | null
  phone: string | null
}

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'CHF', label: 'CHF' },
  { value: 'JPY', label: 'JPY (¥)' },
]

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  hourlyRate: z.string(),
  currency: z.string(),
  notes: z.string(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFormProps {
  client?: ClientFormData
  onSuccess?: () => void
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const isEditing = !!client
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      address: client?.address ?? '',
      hourlyRate: client?.hourlyRate ?? '',
      currency: client?.currency ?? 'USD',
      notes: client?.notes ?? '',
    },
  })
  const isLoading = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const data = {
        name: values.name.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        address: values.address.trim() || null,
        hourlyRate: values.hourlyRate ? String(values.hourlyRate) : null,
        currency: values.currency,
        notes: values.notes.trim() || null,
      }

      if (isEditing) {
        await updateClient(client.id, data)
        toast.success('Client updated')
      } else {
        await createClient(data)
        toast.success('Client created')
      }

      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(
        isEditing ? 'Failed to update client' : 'Failed to create client',
      )
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="Acme Corp"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    placeholder="contact@acme.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    placeholder="+1 (555) 123-4567"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  disabled={isLoading}
                  placeholder="123 Main St, City, Country"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Hourly Rate</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    min="0"
                    placeholder="150.00"
                    step="0.01"
                    type="number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  disabled={isLoading}
                  placeholder="Additional notes about the client..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button disabled={isLoading} type="submit">
            {isLoading ? 'Saving...' : null}
            {!isLoading && isEditing ? 'Update Client' : null}
            {isLoading || isEditing ? null : 'Create Client'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
