'use server'

import { updateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/permissions'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizationSettings } from '@/lib/db/schema'
import type { OrgSettings } from '@/lib/queries/organization-settings'

export async function updateOrganizationSettings(data: Partial<OrgSettings>) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'admin')

  const now = new Date()

  await db
    .insert(organizationSettings)
    .values({
      organizationId,
      companyName: data.companyName,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      companyAddress: data.companyAddress,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: {
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
        companyAddress: data.companyAddress,
        updatedAt: now,
      },
    })

  updateTag(`org-settings-${organizationId}`)

  return { success: true }
}
