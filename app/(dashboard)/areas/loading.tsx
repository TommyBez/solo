import { Skeleton } from '@/components/ui/skeleton'

export default function AreasLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['skeleton-area-1', 'skeleton-area-2', 'skeleton-area-3'].map((id) => (
          <Skeleton className="h-48" key={id} />
        ))}
      </div>
    </div>
  )
}
