import { AreaCard } from '@/components/areas/area-card'
import { CreateAreaDialog } from '@/components/areas/create-area-dialog'
import { getAreasWithStats } from '@/lib/queries/areas'

export default async function AreasPage() {
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
