'use client'

import { GeistPixelSquare } from 'geist/font/pixel'
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import {
  organization,
  useActiveOrganization,
  useListOrganizations,
} from '@/lib/auth/client'

export function OrganizationSwitcher() {
  const router = useRouter()
  const { data: activeOrg } = useActiveOrganization()
  const { data: orgs } = useListOrganizations()

  const handleSwitch = async (orgId: string) => {
    await organization.setActive({ organizationId: orgId })
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="w-full" size="lg">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className={`font-semibold ${GeistPixelSquare.className}`}>
              {activeOrg?.name ?? 'Select Workspace'}
            </span>
            <span className="text-muted-foreground text-xs">
              Solo Time Tracker
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" side="right">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs?.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.id)}>
            <Building2 className="mr-2 size-4" />
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === activeOrg?.id && (
              <Check className="ml-2 size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/org/new')}>
          <Plus className="mr-2 size-4" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
