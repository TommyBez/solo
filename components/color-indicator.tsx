import { cn } from '@/lib/utils'

/**
 * Renders a small colored dot. Used for area/project color indicators.
 * Encapsulates the dynamic backgroundColor style in one place.
 */
export function ColorDot({
  className,
  color,
}: {
  className?: string
  color: string
}) {
  return (
    <div
      className={cn('size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  )
}

/**
 * Renders a vertical colored bar. Used for card accent strips.
 * Encapsulates the dynamic backgroundColor style in one place.
 */
export function ColorBar({
  className,
  color,
}: {
  className?: string
  color: string
}) {
  return (
    <div
      className={cn('absolute top-0 left-0 h-full w-1.5', className)}
      style={{ backgroundColor: color }}
    />
  )
}
