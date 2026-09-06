"use client";

import Image from "next/image";
import React from "react";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Helper to get breadcrumb name based on path
  const getPageName = () => {
    if (pathname.includes("/tasks")) return "Görevlerim";
    if (pathname.includes("/organizations")) return "Organizasyonlar";
    if (pathname.includes("/users")) return "Kullanıcılar";
    if (pathname.includes("/scans")) return "Denetim";
    if (pathname.includes("/reports")) return "Raporlar";
    if (pathname.includes("/profile")) return "Profil";
    return "Ana Sayfa";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm" style={{ backgroundColor: "#90E0EF" }}>
          <div className="flex items-center gap-3" >
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="font-bold text-primary"
                  >
                    Temizlik Takip Sistemi
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-600">
                    {getPageName()}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4" >
                <span className="text-sm font-medium">Admin Panel</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen" style={{ backgroundColor: "#E0F7FA" }}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
