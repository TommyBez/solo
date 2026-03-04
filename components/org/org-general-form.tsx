'use client'

import { zodResolver } from '@hookform/resolvers/zod'
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
import { organization } from '@/lib/auth/client'

const orgGeneralSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z.string(),
})

type OrgGeneralFormValues = z.infer<typeof orgGeneralSchema>

export function OrgGeneralForm({
  orgId,
  initialName,
  initialSlug,
  readOnly,
}: {
  orgId: string
  initialName: string
  initialSlug: string
  readOnly: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const form = useForm<OrgGeneralFormValues>({
    resolver: zodResolver(orgGeneralSchema),
    defaultValues: {
      name: initialName,
      slug: initialSlug,
    },
  })
  const isLoading = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      const { error: apiError } = await organization.update({
        organizationId: orgId,
        data: {
          name: values.name.trim(),
          slug: values.slug.trim() || undefined,
        },
      })

      if (apiError) {
        setError(apiError.message || 'Failed to update workspace')
      } else {
        toast.success('Workspace updated')
        router.refresh()
      }
    } catch {
      setError('Failed to update workspace')
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-destructive text-xs">
            {error}
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input
                  disabled={readOnly || isLoading}
                  placeholder="My Workspace"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl>
                <Input
                  disabled={readOnly || isLoading}
                  placeholder="my-workspace"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Used in URLs to identify your workspace.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {!readOnly && (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </form>
    </Form>
  )
}
