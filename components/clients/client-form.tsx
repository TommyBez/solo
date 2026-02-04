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
type ClientFormData = {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  hourlyRate: string | null
  currency: string
  notes: string | null
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

type ClientFormProps = {
  client?: ClientFormData
  onSuccess?: () => void
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(client?.name ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [address, setAddress] = useState(client?.address ?? '')
  const [hourlyRate, setHourlyRate] = useState(client?.hourlyRate ?? '')
  const [currency, setCurrency] = useState(client?.currency ?? 'USD')
  const [notes, setNotes] = useState(client?.notes ?? '')

  const isEditing = !!client

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Client name is required')
      return
    }

    setIsLoading(true)
    try {
      const data = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        hourlyRate: hourlyRate ? String(hourlyRate) : null,
        currency,
        notes: notes.trim() || null,
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
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          required
          value={name}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@acme.com"
            type="email"
            value={email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            value={phone}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, Country"
          rows={2}
          value={address}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Default Hourly Rate</Label>
          <Input
            id="hourlyRate"
            min="0"
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="150.00"
            step="0.01"
            type="number"
            value={hourlyRate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select onValueChange={setCurrency} value={currency}>
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
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about the client..."
          rows={3}
          value={notes}
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
