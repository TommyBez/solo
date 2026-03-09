import { redirect } from 'next/navigation'
import { getActiveOrganizationSlug } from '@/lib/auth/session'

export default async function RootDashboardPage() {
  const slug = await getActiveOrganizationSlug()
  if (slug) {
    redirect(`/${slug}`)
  }
  // ensureActiveOrganization() in the layout will redirect to /onboarding
  // if there's no org at all, so this is a fallback
  redirect('/onboarding')
}
