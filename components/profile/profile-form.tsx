'use client'

import { KeyRound, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { changePassword, updateUser, useSession } from '@/lib/auth/client'

export function ProfileForm() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = useSession()

  const [name, setName] = useState<string | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  if (sessionPending || !session?.user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const user = session.user
  const displayName = name ?? user.name
  const displayImage = image ?? user.image ?? ''

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await updateUser({
        name: displayName.trim(),
        image: displayImage.trim() || null,
      })
      if (error) {
        toast.error(error.message || 'Failed to update profile')
        return
      }
      setName(null)
      setImage(null)
      toast.success('Profile updated')
      router.refresh()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Current password is required')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })
      if (error) {
        toast.error(error.message || 'Failed to change password')
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed successfully')
    } catch {
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const profileDirty =
    (name !== null && name !== user.name) ||
    (image !== null && image !== (user.image ?? ''))

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your name and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                value={displayName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                disabled
                id="email"
                value={user.email}
              />
              <p className="text-muted-foreground text-xs">
                Email cannot be changed
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Avatar URL</Label>
            <Input
              id="image"
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              value={displayImage}
            />
            <p className="text-muted-foreground text-xs">
              URL to your profile picture
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={saving || !profileDirty}
              onClick={handleSaveProfile}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              type="password"
              value={currentPassword}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                type="password"
                value={newPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                type="password"
                value={confirmPassword}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              onClick={handleChangePassword}
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
