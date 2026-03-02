import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-semibold text-2xl">Page not found</h1>
      <p className="max-w-md text-muted-foreground text-sm">
        The page you requested does not exist or is no longer available.
      </p>
      <Button asChild>
        <Link href="/">Go to dashboard</Link>
      </Button>
    </div>
  )
}
