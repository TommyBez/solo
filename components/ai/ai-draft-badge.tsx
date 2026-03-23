import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiDraftBadgeProps {
  className?: string
}

export function AiDraftBadge({ className }: AiDraftBadgeProps) {
  return (
    <span
      aria-label="AI-generated draft suggestion"
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs',
        className,
      )}
      role="img"
    >
      <Sparkles aria-hidden="true" className="size-3" />
      AI draft
    </span>
  )
}
