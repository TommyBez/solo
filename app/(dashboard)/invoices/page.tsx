import { FileText } from 'lucide-react'
import { CreateInvoiceDialog } from '@/components/invoices/create-invoice-dialog'
import { InvoiceCard } from '@/components/invoices/invoice-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getClients } from '@/lib/queries/clients'
import {
  generateInvoiceNumber,
  getAllUnbilledTimeEntries,
  getInvoiceStats,
  getInvoices,
} from '@/lib/queries/invoices'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

interface InvoicesContentProps {
  clients: Awaited<ReturnType<typeof getClients>>
  filteredInvoices: Awaited<ReturnType<typeof getInvoices>>
  initialInvoiceNumber: string
  statusFilter: string | undefined
  unbilledEntriesByClient: Awaited<ReturnType<typeof getAllUnbilledTimeEntries>>
}

function InvoicesContent({
  clients,
  filteredInvoices,
  initialInvoiceNumber,
  statusFilter,
  unbilledEntriesByClient,
}: InvoicesContentProps) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="font-semibold text-lg">Create a client first</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          You need to create a client before generating invoices.
        </p>
        <a
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm ring-offset-background transition-colors hover:bg-primary/90"
          href="/clients"
        >
          Go to Clients
        </a>
      </div>
    )
  }

  if (filteredInvoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="font-semibold text-lg">
          {statusFilter ? `No ${statusFilter} invoices` : 'No invoices yet'}
        </h3>
        <p className="mb-4 text-muted-foreground text-sm">
          {statusFilter
            ? `You don't have any invoices with status "${statusFilter}".`
            : 'Create your first invoice to start tracking payments.'}
        </p>
        {statusFilter ? null : (
          <CreateInvoiceDialog
            clients={clients}
            initialInvoiceNumber={initialInvoiceNumber}
            unbilledEntriesByClient={unbilledEntriesByClient}
          />
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredInvoices.map((invoice) => (
        <InvoiceCard invoice={invoice} key={invoice.id} />
      ))}
    </div>
  )
}

export default async function InvoicesPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams
  const statusFilter =
    typeof searchParams.status === 'string' ? searchParams.status : undefined

  const [
    invoices,
    stats,
    clients,
    initialInvoiceNumber,
    unbilledEntriesByClient,
  ] = await Promise.all([
    getInvoices(),
    getInvoiceStats(),
    getClients(),
    generateInvoiceNumber(),
    getAllUnbilledTimeEntries(),
  ])

  // Filter invoices by status if filter is set
  const filteredInvoices = statusFilter
    ? invoices.filter((inv) => inv.status === statusFilter)
    : invoices

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  const statusFilters = [
    { key: undefined, label: 'All', count: invoices.length },
    { key: 'draft', label: 'Draft', count: stats.draft },
    { key: 'sent', label: 'Sent', count: stats.sent },
    { key: 'paid', label: 'Paid', count: stats.paid },
    { key: 'overdue', label: 'Overdue', count: stats.overdue },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage invoices for your clients
          </p>
        </div>
        <CreateInvoiceDialog
          clients={clients}
          initialInvoiceNumber={initialInvoiceNumber}
          unbilledEntriesByClient={unbilledEntriesByClient}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Outstanding</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.sent + stats.overdue} invoice
              {stats.sent + stats.overdue !== 1 ? 's' : ''} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Paid</CardTitle>
            <FileText className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(stats.totalPaid)}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.paid} invoice{stats.paid !== 1 ? 's' : ''} paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Overdue</CardTitle>
            <FileText className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-red-600">
              {stats.overdue}
            </div>
            <p className="text-muted-foreground text-xs">
              invoice{stats.overdue !== 1 ? 's' : ''} past due date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Draft</CardTitle>
            <FileText className="size-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.draft}</div>
            <p className="text-muted-foreground text-xs">
              invoice{stats.draft !== 1 ? 's' : ''} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {statusFilters.map((filter) => (
          <a
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              statusFilter === filter.key
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            href={filter.key ? `/invoices?status=${filter.key}` : '/invoices'}
            key={filter.key ?? 'all'}
          >
            {filter.label}
            {filter.count > 0 && (
              <Badge
                className="ml-1"
                variant={statusFilter === filter.key ? 'secondary' : 'outline'}
              >
                {filter.count}
              </Badge>
            )}
          </a>
        ))}
      </div>

      <InvoicesContent
        clients={clients}
        filteredInvoices={filteredInvoices}
        initialInvoiceNumber={initialInvoiceNumber}
        statusFilter={statusFilter}
        unbilledEntriesByClient={unbilledEntriesByClient}
      />
    </div>
  )
}
