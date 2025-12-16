import { Suspense } from 'react'
import { AreaCard } from '@/components/areas/area-card'
import { CreateAreaDialog } from '@/components/areas/create-area-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getAreasWithStats } from '@/lib/actions/areas'

async function AreasContent() {
  const areas = await getAreasWithStats()

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

      {areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="font-semibold text-lg">No areas yet</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Create your first area to start organizing your freelance work
          </p>
          <CreateAreaDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <AreaCard area={area} key={area.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function AreasSkeleton() {
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
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton className="h-48" key={i} />
        ))}
      </div>
    </div>
  )
}

export default function AreasPage() {
  return (
    <Suspense fallback={<AreasSkeleton />}>
      <AreasContent />
    </Suspense>
  )
}
