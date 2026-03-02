'use client'

import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RouteError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-semibold text-2xl">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground text-sm">
        {error.message ||
          'An unexpected error occurred while loading this page.'}
      </p>
      <Button onClick={reset} type="button">
        Try again
      </Button>
    </div>
  )
}
