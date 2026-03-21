import { cn } from '@/lib/utils'

interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({
  message = 'No strong suggestions right now',
  className,
}: EmptyStateProps) {
  return (
    <p className={cn('py-4 text-center text-sm text-muted-foreground', className)}>
      {message}
    </p>
  )
}
