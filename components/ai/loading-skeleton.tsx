import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  type: 'suggestion-card' | 'strip' | 'catchup-module'
  className?: string
}

export function LoadingSkeleton({ type, className }: LoadingSkeletonProps) {
  if (type === 'suggestion-card') {
    return (
      <div
        className={cn(
          'w-72 rounded-lg border bg-card p-4',
          className
        )}
        aria-busy="true"
        aria-label="Loading suggestion"
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
      </div>
    )
  }

  if (type === 'strip') {
    return (
      <div
        className={cn('flex gap-3 overflow-hidden', className)}
        aria-busy="true"
        aria-label="Loading suggestions"
      >
        <LoadingSkeleton type="suggestion-card" />
        <LoadingSkeleton type="suggestion-card" />
        <LoadingSkeleton type="suggestion-card" />
      </div>
    )
  }

  if (type === 'catchup-module') {
    return (
      <div
        className={cn('rounded-lg border bg-card p-4', className)}
        aria-busy="true"
        aria-label="Loading daily review"
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
      </div>
    )
  }

  return null
}
