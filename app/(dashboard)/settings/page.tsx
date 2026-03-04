import { PageHeader } from '@/components/page-header'
import { GoogleCalendarCard } from '@/components/settings/google-calendar-card'
import { SettingsForm } from '@/components/settings/settings-form'
import { getGoogleCalendarStatus } from '@/lib/queries/google-calendar'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function SettingsPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams
  const googleCalendarParam =
    typeof searchParams.googleCalendar === 'string'
      ? searchParams.googleCalendar
      : undefined

  const googleCalendarStatus = await getGoogleCalendarStatus()

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your account preferences"
        title="Settings"
      />

      <SettingsForm />

      <GoogleCalendarCard
        callbackStatus={googleCalendarParam}
        status={googleCalendarStatus}
      />
    </div>
  )
}
