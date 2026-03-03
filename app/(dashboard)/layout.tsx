import type React from 'react'
import { Suspense } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts-provider'
import { MainContentSkeleton } from '@/components/main-content-skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { getSession } from '@/lib/auth/session'
import { SettingsProvider } from '@/lib/context/settings-context'
import { defaultSettings, getSettings } from '@/lib/queries/settings'

// Async component to fetch settings - wrapped in Suspense
async function SettingsProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch settings for the current user
  const session = await getSession()
  const settings = session?.user
    ? await getSettings(session.user.id)
    : defaultSettings

  return (
    <SettingsProvider initialSettings={settings}>{children}</SettingsProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <Suspense
        fallback={
          <>
            <div className="w-[--sidebar-width] shrink-0 border-r bg-sidebar" />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>Solo</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <main className="flex-1 overflow-auto p-4 md:p-6">
                <MainContentSkeleton />
              </main>
            </SidebarInset>
          </>
        }
      >
        <SettingsProviderWrapper>
          <Suspense
            fallback={
              <div className="w-[--sidebar-width] shrink-0 border-r bg-sidebar" />
            }
          >
            <AppSidebar />
          </Suspense>
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Solo</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <Suspense fallback={<MainContentSkeleton />}>
                <KeyboardShortcutsProvider>
                  {children}
                </KeyboardShortcutsProvider>
              </Suspense>
            </main>
          </SidebarInset>
        </SettingsProviderWrapper>
      </Suspense>
    </SidebarProvider>
  )
}
