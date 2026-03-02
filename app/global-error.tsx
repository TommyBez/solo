'use client'

import { Button } from '@/components/ui/button'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-semibold text-2xl">Application error</h1>
          <p className="text-muted-foreground text-sm">
            {error.message ||
              'A critical error occurred while rendering the app.'}
          </p>
          <Button onClick={reset} type="button">
            Try again
          </Button>
        </div>
      </body>
    </html>
  )
}
