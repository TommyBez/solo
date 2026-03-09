import type React from 'react'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { organization } from '@/lib/auth/schema'
import { getActiveOrganizationId } from '@/lib/auth/session'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Validate that the slug corresponds to a real organization
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    columns: { id: true },
  })

  if (!org) {
    notFound()
  }

  // Sync active org in session if it doesn't match the URL slug
  const activeOrgId = await getActiveOrganizationId()
  if (activeOrgId !== org.id) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: org.id },
    })
  }

  return <>{children}</>
}
