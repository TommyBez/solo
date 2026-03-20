'use client'

import type * as React from 'react'
import { useEffect, useState } from 'react'
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

const MOBILE_BREAKPOINT = 768

// Internal hook that returns undefined until mounted, ensuring consistent SSR behavior
function useIsMobileInternal() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
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
  const isMobile = useIsMobileInternal()

  // Don't render anything until we know if we're on mobile or not
  // This prevents the Dialog/Drawer mismatch that causes the error
  if (isMobile === undefined) {
    return null
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

function ResponsiveDialogTrigger({
  children,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobileInternal()

  // Return null until hydrated to prevent context mismatch
  if (isMobile === undefined) return null

  if (isMobile) {
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>
  }

  return <DialogTrigger {...props}>{children}</DialogTrigger>
}

function ResponsiveDialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useIsMobileInternal()

  // Return null until hydrated to prevent context mismatch
  if (isMobile === undefined) return null

  if (isMobile) {
    return (
      <DrawerContent className={className}>
        {children}
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
  const isMobile = useIsMobileInternal()

  // Return null until hydrated to prevent context mismatch
  if (isMobile === undefined) return null

  if (isMobile) {
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
  const isMobile = useIsMobileInternal()

  // Return null until hydrated to prevent context mismatch
  if (isMobile === undefined) return null

  if (isMobile) {
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
  const isMobile = useIsMobileInternal()

  // Return null until hydrated to prevent context mismatch
  if (isMobile === undefined) return null

  if (isMobile) {
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
  const isMobile = useIsMobileInternal()

  // Return null until hydrated to prevent context mismatch
  if (isMobile === undefined) return null

  if (isMobile) {
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
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const isMobile = useIsMobileInternal()

  // Return null until hydrated to prevent context mismatch
  if (isMobile === undefined) return null

  if (isMobile) {
    return <DrawerClose {...props}>{children}</DrawerClose>
  }

  return <DialogClose {...props}>{children}</DialogClose>
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
