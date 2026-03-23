import { CalendarClock, Clock, Github, Repeat, Timer } from 'lucide-react'
import type { EvidenceIcon } from '@/lib/ai/schemas'
import { cn } from '@/lib/utils'

interface EvidenceChipProps {
  className?: string
  icon?: EvidenceIcon
  text: string
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
        'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground text-xs',
        className,
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-3" />}
      {text}
    </span>
  )
}
