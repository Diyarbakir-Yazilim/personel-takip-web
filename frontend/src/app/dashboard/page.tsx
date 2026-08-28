'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock3, 
  Timer, 
  AlertTriangle, 
  MapPin, 
  Activity, 
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/services/apiClient';
import { format, parseISO } from 'date-fns';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  flaggedTasks: number;
  missedTasks: number;
  completionRate: number;
  recentActivity: Array<{
    id: string;
    resolvedAction: string;
    clientScannedAt: string;
    user: { fullName: string };
    task?: { zone: { name: string; code: string } };
  }>;
}

interface Zone {
  id: string;
  name: string;
  code: string;
  description?: string;
  status?: 'FREE' | 'BUSY' | 'ALERT';
}

const statusColors = {
  FREE: { 
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/20', 
    border: 'border-emerald-200/80 dark:border-emerald-900/50', 
    text: 'text-emerald-700 dark:text-emerald-400', 
    badge: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
  },
  BUSY: { 
    bg: 'bg-amber-50/80 dark:bg-amber-950/20', 
    border: 'border-amber-200/80 dark:border-amber-900/50', 
    text: 'text-amber-700 dark:text-amber-400', 
    badge: 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
  },
  ALERT: { 
    bg: 'bg-red-50/80 dark:bg-red-950/20', 
    border: 'border-red-200/80 dark:border-red-900/50', 
    text: 'text-red-700 dark:text-red-400', 
    badge: 'bg-red-100/80 text-red-800 dark:bg-red-900/40 dark:text-red-300' 
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const roleCookie = document.cookie.split('; ').find(row => row.startsWith('role='));
    if (roleCookie) {
      const userRole = roleCookie.split('=')[1];
      setRole(userRole);
      if (userRole === 'STAFF') {
        router.push('/dashboard/tasks');
      }
    } else {
      setRole('ADMIN');
    }
  }, [router]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, zonesRes] = await Promise.all([
        apiRequest('/tasks/dashboard-stats'),
        apiRequest('/organizations/zones')
      ]);

      if (statsRes.success) setStats(statsRes.data as DashboardStats);
      if (zonesRes.success) {
        const data = zonesRes.data as any;
        setZones(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role && role !== 'STAFF') {
      void loadData();
    }
  }, [role]);

  const formatActivityTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  if (role === 'STAFF') return null;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* ÜST BAŞLIK ALANI */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Yönetici Paneli
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30">
                <Sparkles className="size-3" /> Canlı Sistem
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Genel performans istatistikleri ve canlı bölge durumlarını anlık takip edin.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-700 dark:text-slate-200 active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw className={`size-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          Verileri Yenile
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
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
            
            {/* Toplam Görev */}
            <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 size-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Toplam Görev</p>
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm text-white">
                    <LayoutDashboard className="size-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight">{stats.totalTasks}</span>
                  <span className="text-xs font-medium text-white/70">Aktif periyot</span>
                </div>
              </CardContent>
            </Card>

            {/* Tamamlanan */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tamamlanan</p>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{stats.completedTasks}</span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Başarılı</span>
                </div>
              </CardContent>
            </Card>

            {/* Devam Eden & Bekleyen */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Devam Eden & Bekleyen</p>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                    <Timer className="size-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {stats.inProgressTasks + stats.pendingTasks}
                  </span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Süreçte</span>
                </div>
              </CardContent>
            </Card>

            {/* Sorunlu / Geciken */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sorunlu / Geciken</p>
                  <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-600 dark:text-red-400">
                    <AlertTriangle className="size-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {stats.flaggedTasks + stats.missedTasks}
                  </span>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">İnceleme gerekli</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* İKİ SÜTUNLU ANA YERLEŞİM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* SOL SÜTUN: İLERLEME VE BÖLGELER */}
            <div className="lg:col-span-2 space-y-6">

              {/* Günlük İlerleme Kartı */}
              <Card className="rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span>Günlük İlerleme Oranı</span>
                    <span className="text-xl font-extrabold text-primary">%{stats.completionRate}</span>
                  </CardTitle>
                  <CardDescription>Bugün tamamlanması gereken görevlerin genel başarı yüzdesi</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={stats.completionRate} className="h-3 rounded-full bg-slate-100 dark:bg-slate-800" />
                </CardContent>
              </Card>

              {/* Kayıtlı Bölgeler */}
              <div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-primary" />
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Kayıtlı Bölgeler</h2>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {zones.length} Bölge
                  </span>
                </div>

                {zones.length === 0 ? (
                  <Card className="border-dashed border-slate-200 dark:border-slate-800 shadow-none bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <MapPin className="size-10 text-slate-300 dark:text-slate-700 mb-3" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Henüz kayıtlı bir bölge bulunmuyor.</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Organizasyon sekmesinden bölge ekleyebilirsiniz.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {zones.map((zone) => {
                      const currentStatus = zone.status || 'FREE';
                      const c = statusColors[currentStatus];

                      return (
                        <div 
                          key={zone.id} 
                          className={`flex flex-col justify-between p-5 rounded-2xl border ${c.border} ${c.bg} shadow-sm hover:shadow-md transition-all`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant="secondary" className={`font-semibold px-2.5 py-1 rounded-lg text-xs ${c.badge}`}>
                              {currentStatus === 'FREE' ? 'Boş' : currentStatus === 'BUSY' ? 'Meşgul' : 'Uyarı'}
                            </Badge>
                            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                              {zone.code}
                            </span>
                          </div>
                          <div>
                            <h3 className={`text-base font-bold ${c.text}`}>{zone.name}</h3>
                            {zone.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{zone.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* SAĞ SÜTUN: SON AKTİVİTELER */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Activity className="size-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Son Aktiviteler</h2>
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
                        const isCheckIn = activity.resolvedAction === 'CHECK_IN';
                        return (
                          <div key={activity.id} className="p-4 flex gap-3.5 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${isCheckIn ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                              {isCheckIn ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {activity.user?.fullName || 'Bilinmeyen Kullanıcı'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{activity.task?.zone?.name || 'Bilinmeyen Bölge'}</span>
                                <span className="mx-1.5">•</span>
                                <span>{isCheckIn ? 'Giriş' : 'Çıkış'}</span>
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
    </div>
  );
}