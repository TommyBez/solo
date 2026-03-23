import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  type: 'suggestion-card' | 'strip' | 'catchup-module'
}

export function LoadingSkeleton({ type, className }: LoadingSkeletonProps) {
  if (type === 'suggestion-card') {
    return (
      <output
        aria-busy="true"
        aria-label="Loading suggestion"
        className={cn('block w-72 rounded-lg border bg-card p-4', className)}
      >
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </output>
    )
  }

  if (type === 'strip') {
    return (
      <output
        aria-busy="true"
        aria-label="Loading suggestions"
        className={cn('flex gap-3 overflow-hidden', className)}
      >
        <LoadingSkeleton type="suggestion-card" />
        <LoadingSkeleton type="suggestion-card" />
        <LoadingSkeleton type="suggestion-card" />
      </output>
    )
  }

  if (type === 'catchup-module') {
    return (
      <output
        aria-busy="true"
        aria-label="Loading daily review"
        className={cn('block rounded-lg border bg-card p-4', className)}
      >
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <Skeleton className="mb-2 h-4 w-40" />
        <div className="flex gap-3">
          <LoadingSkeleton type="suggestion-card" />
          <LoadingSkeleton type="suggestion-card" />
        </div>
      </output>
    )
  }

  return null
}
