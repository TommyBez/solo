import { PageHeader } from '@/components/page-header'
import { GitHubCard } from '@/components/settings/github-card'
import { GoogleCalendarCard } from '@/components/settings/google-calendar-card'
import { SettingsForm } from '@/components/settings/settings-form'
import { getGitHubStatus } from '@/lib/queries/github'
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
  const githubParam =
    typeof searchParams.github === 'string' ? searchParams.github : undefined

  const [googleCalendarStatus, githubStatus] = await Promise.all([
    getGoogleCalendarStatus(),
    getGitHubStatus(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your account preferences"
        title="Settings"
      />

      <SettingsForm />

      <GitHubCard callbackStatus={githubParam} status={githubStatus} />

      <GoogleCalendarCard
        callbackStatus={googleCalendarParam}
        status={googleCalendarStatus}
      />
    </div>
  )
}
