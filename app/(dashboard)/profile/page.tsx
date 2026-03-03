import { ProfileForm } from '@/components/profile/profile-form'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <ProfileForm />
    </div>
  )
}
