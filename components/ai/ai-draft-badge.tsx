import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiDraftBadgeProps {
  className?: string
}

export function AiDraftBadge({ className }: AiDraftBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className
      )}
      aria-label="AI-generated draft suggestion"
    >
      <Sparkles className="size-3" aria-hidden="true" />
      AI draft
    </span>
  )
}
