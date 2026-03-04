import type React from 'react'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-1 mb-4 max-w-sm text-muted-foreground text-sm">
        {description}
      </p>
      {action}
    </div>
  )
}
