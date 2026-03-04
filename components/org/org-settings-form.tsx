'use client'

import { useState } from 'react'
import { updateOrganizationSettings } from '@/lib/actions/organization-settings'
import type { OrgSettings } from '@/lib/queries/organization-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function OrgSettingsForm({
  settings,
  readOnly,
}: {
  settings: OrgSettings
  readOnly: boolean
}) {
  const [formData, setFormData] = useState(settings)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateOrganizationSettings(formData)
      toast.success('Settings updated')
    } catch {
      toast.error('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) =>
            setFormData({ ...formData, companyName: e.target.value })
          }
          placeholder="Your Company"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyEmail">Company Email</Label>
        <Input
          id="companyEmail"
          type="email"
          value={formData.companyEmail}
          onChange={(e) =>
            setFormData({ ...formData, companyEmail: e.target.value })
          }
          placeholder="billing@company.com"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyPhone">Company Phone</Label>
        <Input
          id="companyPhone"
          value={formData.companyPhone}
          onChange={(e) =>
            setFormData({ ...formData, companyPhone: e.target.value })
          }
          placeholder="+1 (555) 123-4567"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyAddress">Company Address</Label>
        <Textarea
          id="companyAddress"
          value={formData.companyAddress}
          onChange={(e) =>
            setFormData({ ...formData, companyAddress: e.target.value })
          }
          placeholder="123 Main St, City, State 12345"
          disabled={readOnly}
        />
      </div>
      {!readOnly && (
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
    </form>
  )
}
