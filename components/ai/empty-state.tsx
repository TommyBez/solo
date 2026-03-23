import { cn } from '@/lib/utils'

interface EmptyStateProps {
  className?: string
  message?: string
}

export function EmptyState({
  message = 'No strong suggestions right now',
  className,
}: EmptyStateProps) {
  return (
    <p
      className={cn(
        'py-4 text-center text-muted-foreground text-sm',
        className,
      )}
    >
      {message}
    </p>
  )
}
