'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  className?: string
  message?: string
  onRetry: () => void
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
        className,
      )}
      role="alert"
    >
      <div>
        <p className="font-medium text-sm">{message}</p>
        <p className="text-muted-foreground text-xs">
          You can always add entries manually
        </p>
      </div>
      <Button onClick={onRetry} size="sm" variant="outline">
        Try again
      </Button>
    </div>
  )
}
