import type React from 'react'

interface EmptyStateProps {
  action?: React.ReactNode
  description: string
  icon: React.ComponentType<{ className?: string }>
  title: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex animate-fade-in-up flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center sm:p-12">
      <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted sm:mb-4 sm:size-12">
        <Icon className="size-5 text-muted-foreground sm:size-6" />
      </div>
      <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
      <p className="mt-1 mb-3 max-w-sm text-muted-foreground text-xs sm:mb-4 sm:text-sm">
        {description}
      </p>
      {action}
    </div>
  )
}
