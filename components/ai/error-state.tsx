'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  message?: string
  onRetry: () => void
  className?: string
}

export function ErrorState({
  message = "Couldn't generate suggestions",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4',
        className
      )}
      role="alert"
    >
      <div>
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">
          You can always add entries manually
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
