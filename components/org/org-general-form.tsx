'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { organization } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function OrgGeneralForm({
  orgId,
  initialName,
  initialSlug,
  readOnly,
}: {
  orgId: string
  initialName: string
  initialSlug: string
  readOnly: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [slug, setSlug] = useState(initialSlug)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const { error } = await organization.update({
        organizationId: orgId,
        data: {
          name: name.trim(),
          slug: slug.trim() || undefined,
        },
      })

      if (error) {
        toast.error(error.message || 'Failed to update workspace')
      } else {
        toast.success('Workspace updated')
        router.refresh()
      }
    } catch {
      toast.error('Failed to update workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orgName">Workspace Name</Label>
        <Input
          id="orgName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Workspace"
          disabled={readOnly}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="orgSlug">URL Slug</Label>
        <Input
          id="orgSlug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-workspace"
          disabled={readOnly}
        />
        <p className="text-muted-foreground text-xs">
          Used in URLs to identify your workspace.
        </p>
      </div>
      {!readOnly && (
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
    </form>
  )
}
