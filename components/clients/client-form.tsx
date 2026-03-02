'use client'

import { useRouter } from 'next/navigation'
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

interface ClientFormProps {
  client?: ClientFormData
  onSuccess?: () => void
}

interface ClientFormState {
  address: string
  currency: string
  email: string
  hourlyRate: string
  name: string
  notes: string
  phone: string
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<ClientFormState>(() => ({
    name: client?.name ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    address: client?.address ?? '',
    hourlyRate: client?.hourlyRate ?? '',
    currency: client?.currency ?? 'USD',
    notes: client?.notes ?? '',
  }))

  const isEditing = !!client

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Client name is required')
      return
    }

    setIsLoading(true)
    try {
      const data = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        hourlyRate: form.hourlyRate ? String(form.hourlyRate) : null,
        currency: form.currency,
        notes: form.notes.trim() || null,
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Client Name *</Label>
        <Input
          id="name"
          onChange={(e) => {
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }}
          placeholder="Acme Corp"
          required
          value={form.name}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            onChange={(e) => {
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }}
            placeholder="contact@acme.com"
            type="email"
            value={form.email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            onChange={(e) => {
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }}
            placeholder="+1 (555) 123-4567"
            value={form.phone}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          onChange={(e) => {
            setForm((prev) => ({ ...prev, address: e.target.value }))
          }}
          placeholder="123 Main St, City, Country"
          rows={2}
          value={form.address}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Default Hourly Rate</Label>
          <Input
            id="hourlyRate"
            min="0"
            onChange={(e) => {
              setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))
            }}
            placeholder="150.00"
            step="0.01"
            type="number"
            value={form.hourlyRate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            onValueChange={(currency) => {
              setForm((prev) => ({ ...prev, currency }))
            }}
            value={form.currency}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          onChange={(e) => {
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }}
          placeholder="Additional notes about the client..."
          rows={3}
          value={form.notes}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button disabled={isLoading} type="submit">
          {isLoading ? 'Saving...' : null}
          {!isLoading && isEditing ? 'Update Client' : null}
          {isLoading || isEditing ? null : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}
