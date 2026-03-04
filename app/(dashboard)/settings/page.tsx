import { PageHeader } from '@/components/page-header'
import { SettingsForm } from '@/components/settings/settings-form'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your account preferences"
        title="Settings"
      />

      <SettingsForm />
    </div>
  )
}
