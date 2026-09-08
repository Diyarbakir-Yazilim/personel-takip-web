"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock3,
  Timer,
  AlertTriangle,
  MapPin,
  Activity,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/services/apiClient";
import { format, parseISO } from "date-fns";
import { ActiveStaffCard } from "@/components/dashboard/ActiveStaffCard";
import { FloorBreakdownCard } from "@/components/dashboard/FloorBreakdownCard";
import { TotalZonesCard } from "@/components/dashboard/TotalZonesCard";
import { FloorModal } from "@/components/dashboard/FloorModal";
import { StaffModal } from "@/components/dashboard/StaffModal";
import {
  DashboardStats,
  Zone,
  ZonesApiResponse,
  FloorBreakdownItem,
  statusColors,
} from "@/types/dashboard";


export default function DashboardPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<FloorBreakdownItem | null>(
    null,
  );

  // Parametre ekleyerek yükleme state'inin ne zaman değişeceğini kontrol ediyoruz
  const loadData = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      const [statsRes, zonesRes] = await Promise.all([
        apiRequest("/tasks/dashboard-stats"),
        apiRequest("/organizations/zones"),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data as DashboardStats);
      }

      if (zonesRes.success && zonesRes.data) {
        setZones((zonesRes.data as Zone[]) ?? []);
      }
    } catch (error) {
      console.error("Veriler yüklenemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    await loadData(false);
  };
  fetchData();
}, []);

  const formatActivityTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "HH:mm");
    } catch {
      return "--:--";
    }
  };

  const isEmpty = !stats?.floorBreakdown || stats.floorBreakdown.length === 0;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HEADER AREA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Yönetici Paneli
              </h1>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30"
              >
                <Sparkles className="size-3" /> Canlı Sistem
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Genel performans istatistikleri ve canlı bölge durumlarını anlık
              takip edin.
            </p>
          </div>
        </div>

        <button
          onClick={() => void loadData()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-700 dark:text-slate-200 active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw
            className={`size-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`}
          />
          Verileri Yenile
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      ) : stats ? (
        <>
          {/* KPI İSTATİSTİK KARTLARI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ActiveStaffCard
              activeStaff={stats.activeStaff}
              totalStaff={stats.totalStaff}
              onOpenModal={() => setIsStaffModalOpen(true)}
            />
            <TotalZonesCard
              floorBreakdown={stats.floorBreakdown}
              isEmpty={isEmpty}
              onOpenModal={() => setSelectedFloor(stats.floorBreakdown[0] || null)}
            />
          

            <FloorBreakdownCard
              floorBreakdown={stats.floorBreakdown}
              isEmpty={isEmpty}
              onOpenModal={setSelectedFloor}
            />
          </div>
          
          {/* İKİ SÜTUNLU ANA YERLEŞİM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SAĞ SÜTUN: SON AKTİVİTELER */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Activity className="size-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Son Aktiviteler
                </h2>
              </div>

              <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
                <CardContent className="p-0">
                  {stats.recentActivity.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      Son aktivite bulunmuyor.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {stats.recentActivity.map((activity) => {
                        const isCheckIn =
                          activity.resolvedAction === "CHECK_IN";
                        return (
                          <div
                            key={activity.id}
                            className="p-4 flex gap-3.5 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div
                              className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${isCheckIn ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"}`}
                            >
                              {isCheckIn ? (
                                <Clock3 className="size-4" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {activity.user?.fullName ||
                                  "Bilinmeyen Kullanıcı"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {activity.task?.zone?.name ||
                                    "Bilinmeyen Bölge"}
                                </span>
                                <span className="mx-1.5">•</span>
                                <span>{isCheckIn ? "Giriş" : "Çıkış"}</span>
                              </p>
                            </div>
                            <span className="text-xs font-mono font-medium text-slate-400 shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                              {formatActivityTime(activity.clientScannedAt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}

      {/* PERSONEL DETAY MODALI */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        totalStaff={stats?.totalStaff ?? 0}
        activeStaff={stats?.activeStaff ?? 0}
        activeStaffList={stats?.activeStaffList}
        inactiveStaffList={stats?.inactiveStaffList}
      />

      {/* KAT DETAY MODALI */}
      <FloorModal
        selectedFloor={selectedFloor}
        onClose={() => setSelectedFloor(null)}
        isSingleBuilding={
          new Set(stats?.floorBreakdown?.map((f) => f.buildingName)).size <= 1
        }
      />
    </div>
  );
}
