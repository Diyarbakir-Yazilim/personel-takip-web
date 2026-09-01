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
  ShieldCheck,
  Sparkles,
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
  DropdownMenuSeparator,
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
    icon: ShieldCheck,
  },
  {
    label: 'Raporlar',
    href: '/dashboard/reports',
    icon: ClipboardList,
  },
];

const roleConfig: Record<string, string[]> = {
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

const roleLabels: Record<string, { label: string; badgeClass: string }> = {
  ADMIN: { label: 'Yönetici', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  SUPERVISOR: { label: 'Süpervizör', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  STAFF: { label: 'Personel', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
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
    const allowedHrefs = roleConfig[role] || roleConfig.STAFF;
    return navItems.filter((item) => allowedHrefs.includes(item.href));
  }, [role]);

  const currentRoleInfo = roleLabels[role || 'STAFF'] || roleLabels.STAFF;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <Sidebar variant="inset" className="border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="h-18 border-b border-sidebar-border/60 flex flex-row items-center px-5">
        <div className="flex items-center gap-3 w-full">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 shadow-inner border border-sky-500/20">
            <Sparkles className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight leading-tight text-foreground">Temizlik</span>
            <span className="text-base font-bold tracking-tight leading-tight text-foreground">Takip Sistemi</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider text-foreground px-3 mb-2">
            YÖNETİM MENÜSÜ
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1.5">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive}
                    tooltip={item.label}
                    className={`h-11 px-3.5 rounded-xl transition-all duration-200 font-medium transform hover:translate-x-1 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 hover:bg-sky-600 hover:text-white'
                        : 'text-muted-foreground hover:bg-sky-500/15 hover:text-sky-600 dark:hover:text-sky-400'
                    }`}
                  >
                    <item.icon className={`size-4 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-muted-foreground group-hover:scale-110 group-hover:text-sky-600 dark:group-hover:text-sky-400'}`} />
                    <span className="text-sm">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/60 bg-sidebar/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="h-12 px-3 rounded-xl w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-colors">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground border border-border/50">
                      <User className="size-4" />
                    </div>
                    <div className="flex flex-col items-start text-left flex-1 min-w-0 ml-1">
                      <span className="text-xs font-semibold text-foreground truncate w-full">Hesabım</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border mt-0.5 ${currentRoleInfo.badgeClass}`}>
                        {currentRoleInfo.label}
                      </span>
                    </div>
                    <ChevronUp className="size-4 text-muted-foreground ml-auto" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-56 p-1 rounded-xl shadow-lg border border-border/60 bg-popover text-popover-foreground"
              >
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/40 mb-1">
                  Oturum Açıldı
                </div>
                <DropdownMenuItem
                  render={<Link href="/dashboard/profile" />}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors focus:bg-accent"
                >
                  <User className="size-4 text-muted-foreground" />
                  <span>Profili Görüntüle</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 border-border/40" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 cursor-pointer transition-colors focus:bg-red-500/10 focus:text-red-600"
                >
                  <LogOut className="size-4" />
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