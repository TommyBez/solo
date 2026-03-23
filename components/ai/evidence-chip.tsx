import { CalendarClock, Clock, Github, Repeat, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EvidenceIcon } from '@/lib/ai/schemas'

interface EvidenceChipProps {
  icon?: EvidenceIcon
  text: string
  className?: string
}

const iconMap: Record<EvidenceIcon, typeof CalendarClock> = {
  calendar: CalendarClock,
  history: Clock,
  timer: Timer,
  pattern: Repeat,
  github: Github,
}

export function EvidenceChip({ icon, text, className }: EvidenceChipProps) {
  const Icon = icon ? iconMap[icon] : null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground',
        className
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {text}
    </span>
  )
}
