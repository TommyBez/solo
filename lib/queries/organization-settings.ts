import { eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'
import { organizationSettings } from '@/lib/db/schema'

export interface OrgSettings {
  companyAddress: string
  companyEmail: string
  companyName: string
  companyPhone: string
}

const defaultOrgSettings: OrgSettings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
}

export async function getOrganizationSettings(
  organizationId: string,
): Promise<OrgSettings> {
  'use cache'
  cacheTag(`org-settings-${organizationId}`)
  cacheLife('hours')

  const result = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .then((rows) => rows[0])

  if (!result) {
    return defaultOrgSettings
  }

  return {
    companyName: result.companyName ?? defaultOrgSettings.companyName,
    companyEmail: result.companyEmail ?? defaultOrgSettings.companyEmail,
    companyPhone: result.companyPhone ?? defaultOrgSettings.companyPhone,
    companyAddress: result.companyAddress ?? defaultOrgSettings.companyAddress,
  }
}

export { defaultOrgSettings }
