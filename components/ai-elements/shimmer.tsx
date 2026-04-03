'use client'

import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export type ShimmerProps = ComponentProps<'span'> & {
  duration?: number
}

export function Shimmer({
  children,
  className,
  duration = 2,
  ...props
}: ShimmerProps) {
  return (
    <span
      className={cn(
        'inline-block animate-shimmer bg-[length:250%_100%] bg-clip-text text-transparent',
        '[background-image:linear-gradient(90deg,transparent_30%,var(--color-foreground)_50%,transparent_70%),linear-gradient(var(--color-muted-foreground),var(--color-muted-foreground))]',
        '[background-repeat:no-repeat,padding-box]',
        className,
      )}
      style={{
        animationDuration: `${duration}s`,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
