interface Client {
  id: number
  name: string
  email: string | null
  hourlyRate: string | null
  currency: string
  projectCount: number
}

export function ClientsCard({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
        No clients found.
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {clients.map((client) => (
        <div
          key={client.id}
          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{client.name}</span>
            <span className="text-xs text-muted-foreground">
              {client.email ?? 'No email'}
              {client.hourlyRate && (
                <>
                  {' '}
                  &middot; {client.currency} {client.hourlyRate}/hr
                </>
              )}
            </span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {client.projectCount} project
            {client.projectCount !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
