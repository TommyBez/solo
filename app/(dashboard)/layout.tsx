import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type React from 'react'
import { Suspense } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts-provider'
import { MainContentSkeleton } from '@/components/main-content-skeleton'
import { PendingInvitationBanner } from '@/components/org/pending-invitation-banner'
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
import {
  ensureActiveOrganization,
  getActiveOrganizationSlug,
  getSession,
} from '@/lib/auth/session'
import { SettingsProvider } from '@/lib/context/settings-context'
import { defaultSettings, getSettings } from '@/lib/queries/settings'

// Async component to fetch settings and ensure active org - wrapped in Suspense
async function SettingsProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Ensure the user has an active organization set server-side
  await ensureActiveOrganization()

  const settings = session?.user
    ? await getSettings(session.user.id)
    : defaultSettings

  return (
    <SettingsProvider initialSettings={settings}>{children}</SettingsProvider>
  )
}

async function SidebarWithSlug() {
  const slug = await getActiveOrganizationSlug()
  return <AppSidebar slug={slug ?? ''} />
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
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
              <SidebarWithSlug />
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
              <Suspense fallback={null}>
                <PendingInvitationBanner />
              </Suspense>
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
    </NuqsAdapter>
  )
}
