interface Client {
  currency: string
  email: string | null
  hourlyRate: string | null
  id: number
  name: string
  projectCount: number
}

export function ClientsCard({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3 text-muted-foreground text-sm">
        No clients found.
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {clients.map((client) => (
        <div
          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
          key={client.id}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{client.name}</span>
            <span className="text-muted-foreground text-xs">
              {client.email ?? 'No email'}
              {client.hourlyRate && (
                <>
                  {' '}
                  &middot; {client.currency} {client.hourlyRate}/hr
                </>
              )}
            </span>
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {client.projectCount} project
            {client.projectCount !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
