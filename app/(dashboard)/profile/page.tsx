import { PageHeader } from '@/components/page-header'
import { ProfileForm } from '@/components/profile/profile-form'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your personal information"
        title="Profile"
      />

      <ProfileForm />
    </div>
  )
}
