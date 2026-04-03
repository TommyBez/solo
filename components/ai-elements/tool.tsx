'use client'

import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export type ToolProps = ComponentProps<typeof Collapsible>

export function Tool({ className, ...props }: ToolProps) {
  return (
    <Collapsible
      className={cn('group mb-4 w-full rounded-md border', className)}
      {...props}
    />
  )
}

export type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error'

const statusLabels: Record<ToolState, string> = {
  'input-available': 'Running',
  'input-streaming': 'Pending',
  'output-available': 'Completed',
  'output-error': 'Error',
}

const statusIcons: Record<ToolState, ReactNode> = {
  'input-available': <ClockIcon className="size-3.5 animate-pulse" />,
  'input-streaming': <CircleIcon className="size-3.5" />,
  'output-available': <CheckCircleIcon className="size-3.5 text-green-600" />,
  'output-error': <XCircleIcon className="size-3.5 text-red-600" />,
}

export interface ToolHeaderProps {
  className?: string
  state: ToolState
  title?: string
}

export function ToolHeader({ className, title, state }: ToolHeaderProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center justify-between gap-4 p-3',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <WrenchIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
        <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
          {statusIcons[state]}
          {statusLabels[state]}
        </Badge>
      </div>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  )
}

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>

export function ToolContent({ className, ...props }: ToolContentProps) {
  return (
    <CollapsibleContent
      className={cn('space-y-2 border-t p-3 text-xs', className)}
      {...props}
    />
  )
}
