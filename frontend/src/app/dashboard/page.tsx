'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, CheckCircle2, Clock3, Timer, AlertTriangle, ShieldAlert, MapPin, Activity, User, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/services/apiClient';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

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
  description: string;
}

const statusColors = {
  FREE: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
  BUSY: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
  ALERT: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 text-red-800 hover:bg-red-200' },
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

  if (role === 'STAFF') return null;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
            <LayoutDashboard className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yönetici Paneli</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Genel performans istatistikleri ve canlı bölge durumları
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border shadow-sm rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : stats ? (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-white/80">Toplam Görev</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-3xl font-bold tracking-tight">{stats.totalTasks}</span>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <LayoutDashboard className="size-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Tamamlanan</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.completedTasks}</span>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Devam Eden & Bekleyen</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.inProgressTasks + stats.pendingTasks}</span>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Timer className="size-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Sorunlu / Geciken</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.flaggedTasks + stats.missedTasks}</span>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SOL SÜTUN: İLERLEME VE BÖLGELER */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* PROGRESS */}
              <Card className="rounded-2xl shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Günlük İlerleme</CardTitle>
                  <CardDescription>Bugün tamamlanması gereken görevlerin başarı oranı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tamamlanma Oranı</span>
                        <span className="text-sm font-bold text-primary">%{stats.completionRate}</span>
                      </div>
                      <Progress value={stats.completionRate} className="h-3 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LIVE ZONES */}
              <div>
                <div className="flex items-center gap-2 mb-4 px-1">
                  <MapPin className="size-5 text-primary" />
                  <h2 className="text-xl font-semibold tracking-tight">Kayıtlı Bölgeler</h2>
                </div>
                
                {zones.length === 0 ? (
                  <Card className="border-dashed shadow-none bg-slate-50 dark:bg-slate-900/50">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <MapPin className="size-10 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-600">Henüz kayıtlı bir bölge yok.</p>
                      <p className="text-xs text-slate-400 mt-1">Organizasyon sekmesinden bölge ekleyebilirsiniz.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {zones.map((zone) => {
                      // Geçici olarak rastgele statü atıyoruz veya gelecekte backend'den gelecek
                      const mockStatus = 'FREE'; 
                      const c = statusColors[mockStatus];

                      return (
                        <div key={zone.id} className={`flex flex-col p-4 rounded-2xl border ${c.border} ${c.bg} transition-shadow hover:shadow-md`}>
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant="secondary" className={`font-semibold px-2 py-0.5 rounded-md ${c.badge}`}>
                              {mockStatus === 'FREE' ? 'Boş' : mockStatus === 'BUSY' ? 'Meşgul' : 'Uyarı'}
                            </Badge>
                            <span className="text-xs font-mono font-medium text-slate-500 bg-white/50 dark:bg-slate-950/50 px-2 py-1 rounded-lg">
                              {zone.code}
                            </span>
                          </div>
                          <h3 className={`text-base font-bold ${c.text}`}>{zone.name}</h3>
                          {zone.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{zone.description}</p>
                          )}
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
                <h2 className="text-xl font-semibold tracking-tight">Son Aktiviteler</h2>
              </div>

              <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
                <div className="p-0">
                  {stats.recentActivity.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-500">
                      Son aktivite bulunmuyor.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="p-4 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <div className={`p-2 rounded-full shrink-0 ${activity.resolvedAction === 'CHECK_IN' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {activity.resolvedAction === 'CHECK_IN' ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {activity.user.fullName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {activity.task?.zone?.name || 'Bilinmeyen Bölge'} 
                              <span className="mx-1">•</span> 
                              {activity.resolvedAction === 'CHECK_IN' ? 'Giriş' : 'Çıkış'}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0 mt-0.5">
                            {format(parseISO(activity.clientScannedAt), 'HH:mm')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
