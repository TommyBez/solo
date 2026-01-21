import { format } from 'date-fns'
import { ArrowLeft, Building2, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvoicePDFDownload } from '@/components/invoices/invoice-pdf-download'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getInvoice } from '@/lib/queries/invoices'

type Params = Promise<{ id: string }>

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function InvoiceDetailPage(props: { params: Params }) {
  const params = await props.params
  const invoiceId = Number.parseInt(params.id, 10)

  if (Number.isNaN(invoiceId)) {
    notFound()
  }

  const invoice = await getInvoice(invoiceId)

  if (!invoice) {
    notFound()
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild size="icon" variant="ghost">
          <Link href="/invoices">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-3xl tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <Badge className={statusColors[invoice.status]} variant="secondary">
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Invoice for {invoice.client.name}
          </p>
        </div>
        <InvoicePDFDownload invoice={invoice} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Issue Date</p>
              <p className="font-medium">
                {format(new Date(invoice.issueDate), 'MMMM d, yyyy')}
              </p>
            </div>
            {invoice.dueDate ? (
              <div>
                <p className="text-muted-foreground text-sm">Due Date</p>
                <p className="font-medium">
                  {format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground text-sm">Currency</p>
              <p className="font-medium">{invoice.currency}</p>
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Name</p>
              <p className="font-medium">{invoice.client.name}</p>
            </div>
            {invoice.client.email ? (
              <div>
                <p className="text-muted-foreground text-sm">Email</p>
                <p className="font-medium">{invoice.client.email}</p>
              </div>
            ) : null}
            {invoice.client.address ? (
              <div>
                <p className="text-muted-foreground text-sm">Address</p>
                <p className="font-medium">{invoice.client.address}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {Number(invoice.taxRate) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax ({invoice.taxRate}%)
                </span>
                <span>
                  {formatCurrency(invoice.taxAmount, invoice.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-4 font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.rate, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.amount, invoice.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
