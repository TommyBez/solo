'use client'

import type * as React from 'react'
import { createContext, useContext, useEffect } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

type ResponsiveMode = 'dialog' | 'drawer'

const ResponsiveDialogContext = createContext<ResponsiveMode>('dialog')

function useResponsiveMode() {
  return useContext(ResponsiveDialogContext)
}

interface ResponsiveDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function ResponsiveDialog({
  children,
  open,
  onOpenChange,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  // Workaround for vaul bug (https://github.com/emilkowalski/vaul/issues/492):
  // Controlled drawers leave pointer-events: none stuck on body after closing
  // because Radix DismissableLayer's cleanup doesn't fire properly on re-renders
  // (e.g. triggered by router.refresh()). This runs on every render while the
  // drawer is closed to catch late re-renders that re-apply the stale style.
  useEffect(() => {
    if (!isMobile || open) return
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = ''
    }
  })

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value="drawer">
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    )
  }

  return (
    <ResponsiveDialogContext.Provider value="dialog">
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const mode = useResponsiveMode()

  if (mode === 'drawer') {
    return (
      <DrawerTrigger className={className} {...props}>
        {children}
      </DrawerTrigger>
    )
  }

  return (
    <DialogTrigger className={className} {...props}>
      {children}
    </DialogTrigger>
  )
}

function ResponsiveDialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const mode = useResponsiveMode()

  if (mode === 'drawer') {
    return (
      <DrawerContent className={className}>
        <div className="max-h-[calc(80vh-3.5rem)] overflow-y-auto overscroll-y-contain">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  const mode = useResponsiveMode()

  if (mode === 'drawer') {
    return (
      <DrawerHeader className={className} {...props}>
        {children}
      </DrawerHeader>
    )
  }

  return (
    <DialogHeader className={className} {...props}>
      {children}
    </DialogHeader>
  )
}

function ResponsiveDialogFooter({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const mode = useResponsiveMode()

  if (mode === 'drawer') {
    return (
      <DrawerFooter className={className} {...props}>
        {children}
      </DrawerFooter>
    )
  }

  return (
    <DialogFooter className={className} {...props}>
      {children}
    </DialogFooter>
  )
}

function ResponsiveDialogTitle({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const mode = useResponsiveMode()

  if (mode === 'drawer') {
    return (
      <DrawerTitle className={className} {...props}>
        {children}
      </DrawerTitle>
    )
  }

  return (
    <DialogTitle className={className} {...props}>
      {children}
    </DialogTitle>
  )
}

function ResponsiveDialogDescription({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const mode = useResponsiveMode()

  if (mode === 'drawer') {
    return (
      <DrawerDescription className={className} {...props}>
        {children}
      </DrawerDescription>
    )
  }

  return (
    <DialogDescription className={className} {...props}>
      {children}
    </DialogDescription>
  )
}

function ResponsiveDialogClose({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const mode = useResponsiveMode()

  if (mode === 'drawer') {
    return (
      <DrawerClose className={className} {...props}>
        {children}
      </DrawerClose>
    )
  }

  return (
    <DialogClose className={className} {...props}>
      {children}
    </DialogClose>
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogClose,
}
