'use client'

import { Building2, Globe, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { type Settings, useSettings } from '@/lib/hooks/use-settings'

const dateFormats = [
  { value: 'MMM d, yyyy', label: 'Jan 1, 2025' },
  { value: 'MM/dd/yyyy', label: '01/01/2025' },
  { value: 'dd/MM/yyyy', label: '01/01/2025 (EU)' },
  { value: 'yyyy-MM-dd', label: '2025-01-01 (ISO)' },
]

export function SettingsForm() {
  const { settings, isHydrated, updateSettings, resetSettings } = useSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<Settings>>({})
  const form: Settings = { ...settings, ...draft }

  function updateField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setIsSaving(true)
    updateSettings(form)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Settings saved')
    }, 300)
  }

  const handleReset = () => {
    resetSettings()
    setDraft({})
    toast.success('Settings reset to defaults')
  }

  if (!isHydrated) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {['name', 'email', 'phone', 'address'].map((field) => (
              <div className="space-y-2" key={field}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Company Information
          </CardTitle>
          <CardDescription>Your company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Your Company LLC"
                value={form.companyName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                onChange={(e) => updateField('companyEmail', e.target.value)}
                placeholder="billing@company.com"
                type="email"
                value={form.companyEmail}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Phone</Label>
            <Input
              id="companyPhone"
              onChange={(e) => updateField('companyPhone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              value={form.companyPhone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              onChange={(e) => updateField('companyAddress', e.target.value)}
              placeholder="123 Main St&#10;City, State 12345&#10;Country"
              rows={3}
              value={form.companyAddress}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>
            Customize how dates and times are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Week Starts On</Label>
              <Select
                onValueChange={(value) => {
                  updateField('weekStartsOn', value as '0' | '1')
                }}
                value={form.weekStartsOn}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                onValueChange={(value) => updateField('dateFormat', value)}
                value={form.dateFormat}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select
                onValueChange={(value) => {
                  updateField('timeFormat', value as '12' | '24')
                }}
                value={form.timeFormat}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12-hour (1:30 PM)</SelectItem>
                  <SelectItem value="24">24-hour (13:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="mr-2 size-4" />
          Reset to Defaults
        </Button>
        <Button disabled={isSaving} onClick={handleSave}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
