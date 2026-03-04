'use client'

import { Building2, Mail, MoreHorizontal, Phone, Trash2 } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { archiveClient, deleteClient } from '@/lib/actions/clients'
import type { Client } from '@/lib/db/schema'
import { ClientForm } from './client-form'

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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="size-4 text-muted-foreground" />
              {client.name}
            </CardTitle>
            {client.hourlyRate ? (
              <Badge variant="secondary">
                {formatCurrency(client.hourlyRate, client.currency)}
              </Badge>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
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
        <CardContent className="space-y-3">
          {client.email ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Mail className="size-4" />
              <a className="hover:underline" href={`mailto:${client.email}`}>
                {client.email}
              </a>
            </div>
          ) : null}
          {client.phone ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Phone className="size-4" />
              <a className="hover:underline" href={`tel:${client.phone}`}>
                {client.phone}
              </a>
            </div>
          ) : null}
          <div className="pt-2 text-muted-foreground text-sm">
            {projectsCount === 0
              ? 'No projects linked'
              : `${projectsCount} project${projectsCount === 1 ? '' : 's'} linked`}
          </div>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setEditOpen} open={editOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information.</DialogDescription>
          </DialogHeader>
          <ClientForm client={client} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

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
