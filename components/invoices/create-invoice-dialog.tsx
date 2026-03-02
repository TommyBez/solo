'use client'

import { addDays, format } from 'date-fns'
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { createInvoice } from '@/lib/actions/invoices'
import type { Area, Client } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

interface UnbilledEntry {
  description: string | null
  durationMinutes: number
  id: number
  project: {
    id: number
    name: string
    hourlyRate: string | null
    area: {
      id: number
      name: string
      clientId: number | null
      client: Client | null
    }
  }
  startTime: Date
}

interface CreateInvoiceDialogProps {
  clients: (Client & { areas: Area[] })[]
  initialInvoiceNumber: string
  unbilledEntriesByClient: Record<number, UnbilledEntry[]>
}

interface LineItem {
  amount: number
  description: string
  id: string
  quantity: number
  rate: number
  selected: boolean
  timeEntryId: number | null
}

export function CreateInvoiceDialog({
  clients,
  initialInvoiceNumber,
  unbilledEntriesByClient,
}: CreateInvoiceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [clientId, setClientId] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 30))
  const [taxRate, setTaxRate] = useState('0')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  // Set invoice number when dialog opens
  useEffect(() => {
    if (open && !invoiceNumber) {
      setInvoiceNumber(initialInvoiceNumber)
    }
  }, [open, initialInvoiceNumber, invoiceNumber])

  // Update line items when client changes (using pre-fetched data)
  useEffect(() => {
    if (!clientId) {
      setLineItems([])
      return
    }

    const entries = unbilledEntriesByClient[Number(clientId)] || []
    const selectedClient = clients.find((c) => c.id.toString() === clientId)
    const defaultRate = Number(selectedClient?.hourlyRate) || 0

    const items: LineItem[] = entries.map((entry: UnbilledEntry) => {
      const hours = entry.durationMinutes / 60
      const rate = Number(entry.project.hourlyRate) || defaultRate
      return {
        id: `entry-${entry.id}`,
        timeEntryId: entry.id,
        description: `${entry.project.name}${entry.description ? `: ${entry.description}` : ''} (${format(new Date(entry.startTime), 'MMM d')})`,
        quantity: Math.round(hours * 100) / 100,
        rate,
        amount: Math.round(hours * rate * 100) / 100,
        selected: true,
      }
    })
    setLineItems(items)
  }, [clientId, clients, unbilledEntriesByClient])

  const handleToggleItem = (itemId: string) => {
    setLineItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item,
      ),
    )
  }

  const handleUpdateItem = (
    itemId: string,
    field: 'description' | 'quantity' | 'rate',
    value: string | number,
  ) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id !== itemId) {
          return item
        }
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount =
            Math.round(Number(updated.quantity) * Number(updated.rate) * 100) /
            100
        }
        return updated
      }),
    )
  }

  const handleAddManualItem = () => {
    setLineItems((items) => [
      ...items,
      {
        id: `manual-${Date.now()}`,
        timeEntryId: null,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        selected: true,
      },
    ])
  }

  const handleRemoveItem = (itemId: string) => {
    setLineItems((items) => items.filter((item) => item.id !== itemId))
  }

  const selectedItems = lineItems.filter((item) => item.selected)
  const subtotal = selectedItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (Number(taxRate) / 100)
  const total = subtotal + taxAmount

  const selectedClient = clients.find((c) => c.id.toString() === clientId)

  const handleSubmit = async () => {
    if (!clientId) {
      toast.error('Please select a client')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    setIsLoading(true)
    try {
      await createInvoice(
        {
          clientId: Number(clientId),
          invoiceNumber,
          status: 'draft',
          issueDate: format(issueDate, 'yyyy-MM-dd'),
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          taxRate,
          currency: selectedClient?.currency || 'USD',
          notes: notes.trim() || null,
        },
        selectedItems.map((item) => ({
          timeEntryId: item.timeEntryId,
          description: item.description,
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          amount: item.amount.toString(),
        })),
      )

      toast.success('Invoice created')
      setOpen(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error('Failed to create invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setClientId('')
    setInvoiceNumber('')
    setIssueDate(new Date())
    setDueDate(addDays(new Date(), 30))
    setTaxRate('0')
    setNotes('')
    setLineItems([])
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Generate an invoice from unbilled time entries or add items
            manually.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Invoice Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select onValueChange={setClientId} value={clientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                onChange={(e) => setInvoiceNumber(e.target.value)}
                value={invoiceNumber}
              />
            </div>

            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn('w-full justify-start text-left font-normal')}
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {format(issueDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    autoFocus
                    mode="single"
                    onSelect={(d) => {
                      if (d) {
                        setIssueDate(d)
                      }
                    }}
                    selected={issueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn('w-full justify-start text-left font-normal')}
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {format(dueDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    autoFocus
                    mode="single"
                    onSelect={(d) => {
                      if (d) {
                        setDueDate(d)
                      }
                    }}
                    selected={dueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                min="0"
                onChange={(e) => setTaxRate(e.target.value)}
                step="0.01"
                type="number"
                value={taxRate}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Line Items</Label>
              <Button onClick={handleAddManualItem} size="sm" variant="outline">
                <Plus className="mr-2 size-4" />
                Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                {clientId
                  ? 'No unbilled time entries found. Add items manually.'
                  : 'Select a client to see unbilled time entries.'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24 text-right">
                        Qty (hrs)
                      </TableHead>
                      <TableHead className="w-24 text-right">Rate</TableHead>
                      <TableHead className="w-24 text-right">Amount</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow
                        className={cn(!item.selected && 'opacity-50')}
                        key={item.id}
                      >
                        <TableCell>
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => handleToggleItem(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'description',
                                e.target.value,
                              )
                            }
                            placeholder="Description"
                            value={item.description}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            className="h-8 w-full border-0 bg-transparent p-0 text-right shadow-none focus-visible:ring-0"
                            min="0"
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'quantity',
                                Number(e.target.value),
                              )
                            }
                            step="0.01"
                            type="number"
                            value={item.quantity}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            className="h-8 w-full border-0 bg-transparent p-0 text-right shadow-none focus-visible:ring-0"
                            min="0"
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'rate',
                                Number(e.target.value),
                              )
                            }
                            step="0.01"
                            type="number"
                            value={item.rate}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {!item.timeEntryId && (
                            <Button
                              onClick={() => handleRemoveItem(item.id)}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2 className="size-4 text-muted-foreground" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Totals */}
            {selectedItems.length > 0 && (
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {Number(taxRate) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({taxRate}%)
                      </span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, thank you message, etc."
              rows={3}
              value={notes}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
