import { ClientCard } from '@/components/clients/client-card'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { getClients } from '@/lib/queries/clients'

export default async function ClientsPage() {
  const clients = await getClients()

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

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="font-semibold text-lg">No clients yet</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Add your first client to start tracking work and generating
            invoices.
          </p>
          <CreateClientDialog />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard client={client} key={client.id} />
          ))}
        </div>
      )}
    </div>
  )
}
