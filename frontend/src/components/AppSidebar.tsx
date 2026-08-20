'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardList,
  Building2,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  ChevronUp,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  {
    label: 'Ana Sayfa',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Görevlerim',
    href: '/dashboard/tasks',
    icon: ClipboardList,
  },
  {
    label: 'Organizasyonlar',
    href: '/dashboard/organizations',
    icon: Building2,
  },
  {
    label: 'Kullanıcılar',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    label: 'Denetim',
    href: '/dashboard/scans',
    icon: ClipboardList,
  },
  {
    label: 'Raporlar',
    href: '/dashboard/reports',
    icon: ClipboardList,
  },
];

const roleConfig = {
  STAFF: ['/dashboard/tasks', '/dashboard/profile'],
  ADMIN: [
    '/dashboard',
    '/dashboard/organizations',
    '/dashboard/users',
    '/dashboard/scans',
    '/dashboard/reports',
  ],
  SUPERVISOR: [
    '/dashboard',
    '/dashboard/organizations',
    '/dashboard/users',
    '/dashboard/scans',
    '/dashboard/reports',
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )role=([^;]+)'));
    if (match) {
      setRole(match[2]);
    } else {
      setRole('STAFF');
    }
  }, []);

  const filteredNavItems = React.useMemo(() => {
    if (!role) return [];
    const allowedHrefs = roleConfig[role as keyof typeof roleConfig] || roleConfig.STAFF;
    return navItems.filter((item) => allowedHrefs.includes(item.href));
  }, [role]);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'role=; path=/; max-age=0';
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="h-16 border-b flex flex-row items-center justify-center px-4">
        <div className="flex items-center gap-3 w-full">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">DTSO Temizlik</span>
            <span className="text-xs font-medium text-muted-foreground">Takip Sistemi</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <User />
                  <span>Hesabım</span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              } />
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
                  Profili Görüntüle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="mr-2 size-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
