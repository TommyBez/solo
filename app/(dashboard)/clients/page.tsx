import { Suspense } from 'react'
import { ClientCard } from '@/components/clients/client-card'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getClients } from '@/lib/queries/clients'

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and their billing information
          </p>
        </div>
        <CreateClientDialog />
      </div>

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
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="font-semibold text-lg">No clients yet</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Add your first client to start tracking work.
        </p>
        <CreateClientDialog />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <ClientCard client={client} key={client.id} />
      ))}
    </div>
  )
}

function ClientsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[
        'client-1',
        'client-2',
        'client-3',
        'client-4',
        'client-5',
        'client-6',
      ].map((key) => (
        <div className="space-y-4 rounded-lg border p-6" key={key}>
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
