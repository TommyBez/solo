'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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

const createOrgSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z.string(),
})

type CreateOrgFormValues = z.infer<typeof createOrgSchema>

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function CreateOrgForm({
  showCancel = true,
}: {
  showCancel?: boolean
} = {}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const form = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })
  const isLoading = form.formState.isSubmitting

  const name = form.watch('name')
  useEffect(() => {
    form.setValue('slug', generateSlug(name))
  }, [name, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      const { data, error: apiError } = await organization.create({
        name: values.name.trim(),
        slug: values.slug || generateSlug(values.name),
      })

      if (apiError) {
        setError(apiError.message || 'Failed to create workspace')
        return
      }

      if (data) {
        await organization.setActive({ organizationId: data.id })
        toast.success('Workspace created')
        router.push(`/${data.slug}`)
        router.refresh()
      }
    } catch {
      setError('Failed to create workspace')
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="My Company"
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
                  disabled={isLoading}
                  placeholder="my-company"
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
        <div className="flex justify-end gap-2">
          {showCancel && (
            <Button
              onClick={() => router.back()}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button disabled={isLoading} type="submit">
            {isLoading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
