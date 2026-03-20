'use client'

import type * as React from 'react'
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
import { cn } from '@/lib/utils'

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
  return (
    <>
      {/* Desktop: Dialog */}
      <div className="hidden md:contents">
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      </div>
      {/* Mobile: Drawer */}
      <div className="contents md:hidden">
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </div>
    </>
  )
}

function ResponsiveDialogTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  return (
    <>
      <DialogTrigger className={cn('hidden md:inline-flex', className)} {...props}>
        {children}
      </DialogTrigger>
      <DrawerTrigger className={cn('md:hidden', className)} {...props}>
        {children}
      </DrawerTrigger>
    </>
  )
}

function ResponsiveDialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <>
      <DialogContent className={cn('hidden md:block', className)} {...props}>
        {children}
      </DialogContent>
      <DrawerContent className={cn('md:hidden', className)}>
        {children}
      </DrawerContent>
    </>
  )
}

function ResponsiveDialogHeader({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  return (
    <>
      <DialogHeader className={cn('hidden md:block', className)} {...props}>
        {children}
      </DialogHeader>
      <DrawerHeader className={cn('md:hidden', className)} {...props}>
        {children}
      </DrawerHeader>
    </>
  )
}

function ResponsiveDialogFooter({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  return (
    <>
      <DialogFooter className={cn('hidden md:flex', className)} {...props}>
        {children}
      </DialogFooter>
      <DrawerFooter className={cn('md:hidden', className)} {...props}>
        {children}
      </DrawerFooter>
    </>
  )
}

function ResponsiveDialogTitle({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  return (
    <>
      <DialogTitle className={cn('hidden md:block', className)} {...props}>
        {children}
      </DialogTitle>
      <DrawerTitle className={cn('md:hidden', className)} {...props}>
        {children}
      </DrawerTitle>
    </>
  )
}

function ResponsiveDialogDescription({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  return (
    <>
      <DialogDescription className={cn('hidden md:block', className)} {...props}>
        {children}
      </DialogDescription>
      <DrawerDescription className={cn('md:hidden', className)} {...props}>
        {children}
      </DrawerDescription>
    </>
  )
}

function ResponsiveDialogClose({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  return (
    <>
      <DialogClose className={cn('hidden md:inline-flex', className)} {...props}>
        {children}
      </DialogClose>
      <DrawerClose className={cn('md:hidden', className)} {...props}>
        {children}
      </DrawerClose>
    </>
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
