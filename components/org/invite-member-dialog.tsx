'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { organization } from '@/lib/auth/client'

const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
})

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>

export function InviteMemberDialog({
  organizationId,
}: {
  organizationId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  })
  const isLoading = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      const { error: apiError } = await organization.inviteMember({
        email: values.email.trim(),
        role: values.role as 'member' | 'admin',
        organizationId,
      })

      if (apiError) {
        setError(apiError.message || 'Failed to send invitation')
      } else {
        toast.success(`Invitation sent to ${values.email}`)
        form.reset()
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError('Failed to send invitation')
    }
  })

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      form.reset()
      setError('')
    }
  }

  const trigger = (
    <Button size="sm">
      <UserPlus className="mr-2 size-4" />
      Invite Member
    </Button>
  )

  const formContent = (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-destructive text-xs">
            {error}
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="colleague@example.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Viewers can only view data and export. Members can create and
                edit. Admins can also manage workspace settings.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isLoading} type="submit">
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Form>
  )

  return (
    <ResponsiveDialog
      description="Send an invitation to join this workspace."
      onOpenChange={handleOpenChange}
      open={open}
      title="Invite Member"
      trigger={trigger}
    >
      {formContent}
    </ResponsiveDialog>
  )
}
