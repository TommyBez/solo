import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  const skeletonGroups = [
    { id: 'group-1', cards: ['card-1', 'card-2', 'card-3'] },
    { id: 'group-2', cards: ['card-4', 'card-5', 'card-6'] },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-8">
        {skeletonGroups.map((group) => (
          <div className="space-y-4" key={group.id}>
            <Skeleton className="h-7 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.cards.map((cardId) => (
                <Skeleton className="h-52" key={cardId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
