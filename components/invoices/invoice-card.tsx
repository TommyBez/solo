'use client'

import { format } from 'date-fns'
import { Building2, FileText, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteInvoice, updateInvoiceStatus } from '@/lib/actions/invoices'
import type { Client, Invoice, InvoiceLineItem } from '@/lib/db/schema'

type InvoiceCardProps = {
  invoice: Invoice & {
    client: Client
    lineItems: InvoiceLineItem[]
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  const formatCurrency = (amount: string | null, currency: string) => {
    if (!amount) {
      return '$0.00'
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
    return `${symbols[currency] || ''}${Number(amount).toFixed(2)}`
  }

  const handleDelete = async () => {
    try {
      await deleteInvoice(invoice.id)
      toast.success('Invoice deleted')
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const handleStatusChange = async (
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  ) => {
    try {
      await updateInvoiceStatus(invoice.id, status)
      toast.success(`Invoice marked as ${status}`)
    } catch {
      toast.error('Failed to update invoice status')
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-4 text-muted-foreground" />
              {invoice.invoiceNumber}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                className={statusColors[invoice.status]}
                variant="secondary"
              >
                {invoice.status.charAt(0).toUpperCase() +
                  invoice.status.slice(1)}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${invoice.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {invoice.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange('sent')}>
                  Mark as Sent
                </DropdownMenuItem>
              )}
              {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                <DropdownMenuItem onClick={() => handleStatusChange('paid')}>
                  Mark as Paid
                </DropdownMenuItem>
              )}
              {invoice.status === 'sent' && (
                <DropdownMenuItem onClick={() => handleStatusChange('overdue')}>
                  Mark as Overdue
                </DropdownMenuItem>
              )}
              {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('cancelled')}
                >
                  Cancel Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
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
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Building2 className="size-4" />
            {invoice.client.name}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
            </span>
            <span className="font-semibold text-lg">
              {formatCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
          <div className="text-muted-foreground text-xs">
            {invoice.lineItems.length} item
            {invoice.lineItems.length === 1 ? '' : 's'}
          </div>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice &quot;
              {invoice.invoiceNumber}
              &quot;? This action cannot be undone. Time entries will be
              unlinked but not deleted.
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
