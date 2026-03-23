import { Users } from 'lucide-react'
import { Suspense } from 'react'
import { ClientCard } from '@/components/clients/client-card'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getClients } from '@/lib/queries/clients'

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your clients and their billing information"
        title="Clients"
      >
        <CreateClientDialog />
      </PageHeader>

      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsContent />
      </Suspense>
    </div>
  )
}

async function ClientsContent() {
  const clients = await getClients()

  if (clients.length === 0) {
    return (
      <EmptyState
        action={<CreateClientDialog />}
        description="Add your first client to start tracking work."
        icon={Users}
        title="No clients yet"
      />
    )
  }

  return (
    <div className="stagger-children grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {clients.map((client) => (
        <ClientCard client={client} key={client.id} />
      ))}
    </div>
  )
}

function ClientsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {['client-1', 'client-2', 'client-3'].map((key) => (
        <div className="space-y-4 rounded-lg border p-4 sm:p-6" key={key}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}
