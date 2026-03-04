import { Layers } from 'lucide-react'
import { Suspense } from 'react'
import { AreaCard } from '@/components/areas/area-card'
import { CreateAreaDialog } from '@/components/areas/create-area-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getAreasWithStats } from '@/lib/queries/areas'

export default function AreasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your broad focus contexts and weekly goals"
        title="Areas"
      >
        <CreateAreaDialog />
      </PageHeader>

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
      <EmptyState
        action={<CreateAreaDialog />}
        description="Create your first area to start organizing your freelance work"
        icon={Layers}
        title="No areas yet"
      />
    )
  }

  return (
    <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
