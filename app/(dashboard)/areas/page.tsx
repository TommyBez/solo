import { Suspense } from 'react'
import { AreaCard } from '@/components/areas/area-card'
import { CreateAreaDialog } from '@/components/areas/create-area-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getAreasWithStats } from '@/lib/queries/areas'

export default function AreasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Areas</h1>
          <p className="text-muted-foreground">
            Manage your broad focus contexts and weekly goals
          </p>
        </div>
        <CreateAreaDialog />
      </div>

      <Suspense fallback={<AreasSkeleton />}>
        <AreasContent />
      </Suspense>
    </div>
  )
}

async function AreasContent() {
  const areas = await getAreasWithStats()

  if (areas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="font-semibold text-lg">No areas yet</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Create your first area to start organizing your freelance work
        </p>
        <CreateAreaDialog />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {areas.map((area) => (
        <AreaCard area={area} key={area.id} />
      ))}
    </div>
  )
}

function AreasSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {['skeleton-area-1', 'skeleton-area-2', 'skeleton-area-3'].map((id) => (
        <Skeleton className="h-48" key={id} />
      ))}
    </div>
  )
}
