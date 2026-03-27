'use client'

import type * as React from 'react'
import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface ResponsiveDialogProps {
  children: React.ReactNode
  className?: string
  description?: React.ReactNode
  desktopFooterClassName?: string
  footer?: React.ReactNode
  mobileBodyClassName?: string
  mobileFooterClassName?: string
  onOpenChange?: (open: boolean) => void
  open?: boolean
  showCloseButton?: boolean
  title?: React.ReactNode
  trigger?: React.ReactNode
}

function ResponsiveDialog({
  children,
  className,
  description,
  desktopFooterClassName,
  footer,
  mobileBodyClassName,
  mobileFooterClassName,
  onOpenChange,
  open,
  showCloseButton,
  title,
  trigger,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()
  const hasHeader = title || description

  useEffect(() => {
    if (!isMobile || open) {
      return
    }

    const clearInteractionLock = () => {
      document.body.style.pointerEvents = ''
      document.body.style.removeProperty('pointer-events')
      document.documentElement.style.pointerEvents = ''
      document.documentElement.style.removeProperty('pointer-events')
    }

    clearInteractionLock()

    const frameId = window.requestAnimationFrame(clearInteractionLock)
    const timeoutId = window.setTimeout(clearInteractionLock, 500)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
    }
  }, [isMobile, open])

  if (!isMobile) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent className={className} showCloseButton={showCloseButton}>
          {hasHeader ? (
            <DialogHeader>
              {title ? <DialogTitle>{title}</DialogTitle> : null}
              {description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </DialogHeader>
          ) : null}
          {children}
          {footer ? (
            <DialogFooter className={desktopFooterClassName}>{footer}</DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent className={className}>
        {hasHeader ? (
          <DrawerHeader className="text-left">
            {title ? <DrawerTitle>{title}</DrawerTitle> : null}
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
        ) : null}
        <div
          className={cn(
            'max-h-[calc(80vh-3.5rem)] overflow-y-auto overscroll-y-contain px-4 pb-4',
            mobileBodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <DrawerFooter className={mobileFooterClassName}>{footer}</DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

export { ResponsiveDialog }
