'use client'

import { Mail, MoreHorizontal, Phone, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { archiveClient, deleteClient } from '@/lib/actions/clients'
import type { Client } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { ClientForm } from './client-form'

const avatarColors = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-teal-600',
]

interface ClientCardProps {
  client: Client & {
    projects?: { id: number }[]
  }
}

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const projectsCount = client.projects?.length ?? 0

  const formatCurrency = (rate: string | null, currency: string) => {
    if (!rate) {
      return null
    }
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF ',
      JPY: '¥',
    }
    return `${symbols[currency] || ''}${Number(rate).toFixed(2)}/hr`
  }

  const handleDelete = async () => {
    try {
      await deleteClient(client.id)
      toast.success('Client deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete client')
    }
  }

  const handleArchive = async () => {
    try {
      await archiveClient(client.id)
      toast.success('Client archived')
      router.refresh()
    } catch {
      toast.error('Failed to archive client')
    }
  }

  const openEditDialog = () => {
    window.setTimeout(() => {
      setEditOpen(true)
    }, 0)
  }

  const editForm = (
    <ClientForm client={client} onSuccess={() => setEditOpen(false)} />
  )

  return (
    <>
      <Card className="transition-[box-shadow,ring-color] duration-200 hover:ring-foreground/20">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md font-semibold text-sm text-white sm:size-9',
                avatarColors[client.name.charCodeAt(0) % avatarColors.length],
              )}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-base sm:text-lg">
                {client.name}
              </CardTitle>
              {client.hourlyRate ? (
                <Badge
                  className="font-mono text-[10px] tabular-nums sm:text-xs"
                  variant="secondary"
                >
                  {formatCurrency(client.hourlyRate, client.currency)}
                </Badge>
              ) : null}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="size-9 shrink-0 sm:size-8"
                size="icon"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={openEditDialog}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0 sm:space-y-3 sm:p-6 sm:pt-0">
          {client.email ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
              <Mail className="size-3.5 shrink-0 sm:size-4" />
              <a
                className="truncate hover:underline"
                href={`mailto:${client.email}`}
              >
                {client.email}
              </a>
            </div>
          ) : null}
          {client.phone ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
              <Phone className="size-3.5 shrink-0 sm:size-4" />
              <a className="hover:underline" href={`tel:${client.phone}`}>
                {client.phone}
              </a>
            </div>
          ) : null}
          <div className="pt-1 text-muted-foreground text-xs sm:pt-2 sm:text-sm">
            {projectsCount === 0
              ? 'No projects linked'
              : `${projectsCount} project${projectsCount === 1 ? '' : 's'} linked`}
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        className="md:max-w-lg"
        description="Update client information."
        onOpenChange={setEditOpen}
        open={editOpen}
        title="Edit Client"
      >
        {editForm}
      </ResponsiveDialog>

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{client.name}&quot;? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
