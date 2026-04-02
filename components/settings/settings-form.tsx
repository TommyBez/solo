'use client'

import { Bot, Globe, RotateCcw } from 'lucide-react'
import Link from 'next/link'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useActiveOrganization } from '@/lib/auth/client'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Settings } from '@/lib/queries/settings'

const dateFormats = [
  { value: 'MMM d, yyyy', label: 'Jan 1, 2025' },
  { value: 'MM/dd/yyyy', label: '01/01/2025' },
  { value: 'dd/MM/yyyy', label: '01/01/2025 (EU)' },
  { value: 'yyyy-MM-dd', label: '2025-01-01 (ISO)' },
]

export function SettingsForm({
  canUseAiFeatures,
}: {
  canUseAiFeatures: boolean
}) {
  const { settings, updateSettings, isPending } = useSettingsContext()
  const { data: activeOrg } = useActiveOrganization()
  const [draft, setDraft] = useState<Partial<Settings>>({})
  const form: Settings = { ...settings, ...draft }

  function buildSettingsPayload(values: Settings): Partial<Settings> {
    if (canUseAiFeatures) {
      return values
    }

    const { aiEnabled: _aiEnabled, ...rest } = values
    return rest
  }

  function updateField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      await updateSettings(buildSettingsPayload(form))
      setDraft({})
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  const handleReset = async () => {
    try {
      await updateSettings(
        buildSettingsPayload({
          ...settings,
          weekStartsOn: '1',
          dateFormat: 'MMM d, yyyy',
          timeFormat: '12',
          aiEnabled: true,
        }),
      )
      setDraft({})
      toast.success('Settings reset to defaults')
    } catch {
      toast.error('Failed to reset settings')
    }
  }

  return (
    <div className="space-y-6">
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
          <p className="text-muted-foreground text-sm">
            Company information has moved to{' '}
            <Link
              className="text-primary underline"
              href={
                activeOrg?.slug ? `/${activeOrg.slug}/settings` : '/settings'
              }
            >
              Workspace Settings
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {canUseAiFeatures ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5" />
              AI Features
            </CardTitle>
            <CardDescription>
              Control AI-powered suggestions and enhancements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ai-enabled">Enable AI Features</Label>
                <p className="text-muted-foreground text-sm">
                  Show AI-powered suggestions for time entries, descriptions,
                  and weekly reviews
                </p>
              </div>
              <Switch
                checked={form.aiEnabled}
                id="ai-enabled"
                onCheckedChange={(checked) => updateField('aiEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button disabled={isPending} onClick={handleReset} variant="outline">
          <RotateCcw className="mr-2 size-4" />
          Reset to Defaults
        </Button>
        <Button disabled={isPending} onClick={handleSave}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
