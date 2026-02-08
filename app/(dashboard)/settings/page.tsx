import { SettingsForm } from '@/components/settings/settings-form'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences
        </p>
      </div>

      <SettingsForm />
    </div>
  )
}
