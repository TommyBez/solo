'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateOrganizationSettings } from '@/lib/actions/organization-settings'
import type { OrgSettings } from '@/lib/queries/organization-settings'

const orgSettingsSchema = z.object({
  companyName: z.string(),
  companyEmail: z.string(),
  companyPhone: z.string(),
  companyAddress: z.string(),
})

type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>

export function OrgSettingsForm({
  settings,
  readOnly,
}: {
  settings: OrgSettings
  readOnly: boolean
}) {
  const [error, setError] = useState('')
  const form = useForm<OrgSettingsFormValues>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      companyName: settings.companyName,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
      companyAddress: settings.companyAddress,
    },
  })
  const isLoading = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      await updateOrganizationSettings(values)
      toast.success('Settings updated')
    } catch {
      setError('Failed to update settings')
      toast.error('Failed to update settings')
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-destructive text-xs">
            {error}
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input
                  disabled={readOnly || isLoading}
                  placeholder="Your Company"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Email</FormLabel>
              <FormControl>
                <Input
                  disabled={readOnly || isLoading}
                  placeholder="billing@company.com"
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
          name="companyPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Phone</FormLabel>
              <FormControl>
                <Input
                  disabled={readOnly || isLoading}
                  placeholder="+1 (555) 123-4567"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Address</FormLabel>
              <FormControl>
                <Textarea
                  disabled={readOnly || isLoading}
                  placeholder="123 Main St, City, State 12345"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!readOnly && (
          <Button disabled={isLoading} type="submit">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </form>
    </Form>
  )
}
