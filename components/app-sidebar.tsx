'use client'
import {
  Building2,
  Clock,
  FolderKanban,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { OrganizationSwitcher } from '@/components/organization-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { UserMenu } from '@/components/user-menu'

export function AppSidebar({ slug }: { slug: string }) {
  const pathname = usePathname()
  const prefix = slug ? `/${slug}` : ''

  const navigationItems = [
    {
      title: 'Dashboard',
      url: prefix || '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Areas',
      url: `${prefix}/areas`,
      icon: Layers,
    },
    {
      title: 'Projects',
      url: `${prefix}/projects`,
      icon: FolderKanban,
    },
    {
      title: 'Time Tracking',
      url: `${prefix}/time`,
      icon: Clock,
    },
    {
      title: 'Clients',
      url: `${prefix}/clients`,
      icon: Users,
    },
    {
      title: 'Chat',
      url: `${prefix}/chat`,
      icon: MessageSquare,
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <OrganizationSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === prefix || item.url === '/'
                        ? pathname === prefix || pathname === `${prefix}/`
                        : pathname.startsWith(item.url)
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Organization">
              <Link href={`${prefix}/settings`}>
                <Building2 className="size-4" />
                <span>Organization</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
