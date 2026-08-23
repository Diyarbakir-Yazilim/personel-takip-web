'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertCircle,
  QrCode,
  Clock,
  MapPin,
  ShieldAlert,
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  Timer,
  Activity,
  Hourglass,
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ScanEvent {
  id: string;
  clientScannedAt: string;
  requestedAction: string;
  resolvedAction: string;
  method: string;
  riskScore: number;
  durationMinutes?: number | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  task?: {
    zone: {
      name: string;
      code: string;
    };
  };
}

/**
 * Kademeli ve Dinamik Tarih Formatı
 * - Bugün için: "Bugün, 05:39"
 * - Dün için: "Dün, 14:20"
 * - 1 Haftaya kadar olan geçmiş için: "Pazartesi, 09:15"
 * - 1 Haftadan eski tarihler için: "20 Ağu 2026, 05:35"
 */
function formatSmartDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    const now = new Date();

    if (isToday(date)) {
      return `Bugün, ${format(date, 'HH:mm')}`;
    }

    if (isYesterday(date)) {
      return `Dün, ${format(date, 'HH:mm')}`;
    }

    const diffDays = differenceInDays(now, date);
    if (diffDays >= 0 && diffDays < 7) {
      const dayName = format(date, 'EEEE', { locale: tr });
      const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return `${capitalized}, ${format(date, 'HH:mm')}`;
    }

    return format(date, 'd MMM yyyy, HH:mm', { locale: tr });
  } catch {
    return dateString;
  }
}

/**
 * İsimden baş harfleri türetme (Örn: "Ali Kaya" -> "AK")
 */
function getInitials(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * İsim hash'ine göre belirlenen modern ve uyumlu renk paleti
 */
const AVATAR_COLOR_PALETTES = [
  'bg-blue-500/15 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'bg-violet-500/15 text-violet-700 dark:bg-violet-500/25 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  'bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/25 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'bg-teal-500/15 text-teal-700 dark:bg-teal-500/25 dark:text-teal-300 border-teal-200 dark:border-teal-800',
];

function getAvatarColorClass(name?: string): string {
  if (!name) return AVATAR_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[index];
}

/**
 * Dakikayı "1 sa 45 dk" veya "45 dk" formatına dönüştürme
 */
function formatDuration(minutes?: number | null): string | null {
  if (minutes === null || minutes === undefined) return null;
  if (minutes < 1) return '< 1 dk';
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} sa`;
  return `${hours} sa ${remainingMinutes} dk`;
}

export default function ScansPage() {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CHECK_IN' | 'CHECK_OUT'>('ALL');

  const fetchScans = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { apiRequest } = await import('@/services/apiClient');
      const res = await apiRequest('/scans?take=50');

      if (!res.success) throw new Error('Tarama geçmişi alınamadı.');

      const data = res.data as any;
      setScans(data.data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchScans();
  }, []);

  // Filtrelenmiş tarama listesi
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Aksiyon filtresi
      if (selectedFilter !== 'ALL' && scan.resolvedAction !== selectedFilter) {
        return false;
      }
      // Arama filtresi
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const userName = scan.user?.fullName?.toLowerCase() || '';
      const userEmail = scan.user?.email?.toLowerCase() || '';
      const zoneName = scan.task?.zone?.name?.toLowerCase() || '';
      const zoneCode = scan.task?.zone?.code?.toLowerCase() || '';

      return userName.includes(q) || userEmail.includes(q) || zoneName.includes(q) || zoneCode.includes(q);
    });
  }, [scans, selectedFilter, searchQuery]);

  // Özet İstatistikler
  const stats = useMemo(() => {
    const total = scans.length;
    const checkIns = scans.filter((s) => s.resolvedAction === 'CHECK_IN').length;
    const checkOuts = scans.filter((s) => s.resolvedAction === 'CHECK_OUT').length;
    const durations = scans
      .map((s) => s.durationMinutes)
      .filter((d): d is number => typeof d === 'number' && d > 0);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    return { total, checkIns, checkOuts, avgDuration };
  }, [scans]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CHECK_IN':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-semibold gap-1.5 px-2.5 py-1">
            <LogIn className="size-3.5" />
            Giriş
          </Badge>
        );
      case 'CHECK_OUT':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 font-semibold gap-1.5 px-2.5 py-1">
            <LogOut className="size-3.5" />
            Çıkış
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-semibold gap-1 px-2 py-0.5">
            <Activity className="size-3" />
            {action}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Üst Başlık & Aksiyon Alanı */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent text-primary shadow-xs ring-1 ring-primary/20">
            <QrCode className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Ana Denetim & Tarama Geçmişi
            </h1>
            <p className="text-sm text-muted-foreground">
              Personellerin canlı QR okutma hareketleri ve süre analizleri
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchScans(true)}
          disabled={isLoading || isRefreshing}
          className="gap-2 shadow-xs transition-all active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* Hata Bildirimi */}
      {error && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 animate-in fade-in-50">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* İstatistik & Özet Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Toplam Tarama</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <QrCode className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.total}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sistemdeki son kayıtlar</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-950 border border-emerald-100/80 dark:border-emerald-900/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Girişler</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <LogIn className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.checkIns}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Başlatılan vardiya/iş</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-950 border border-blue-100/80 dark:border-blue-900/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Çıkışlar</span>
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <LogOut className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">
            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.checkOuts}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Tamamlanan vardiya/iş</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-950 border border-amber-100/80 dark:border-amber-900/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Ort. İçeride Süre</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Timer className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : stats.avgDuration ? (
              formatDuration(stats.avgDuration)
            ) : (
              '—'
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Hesaplanan ortalama</p>
        </Card>
      </div>

      {/* Arama & Filtreleme Çubuğu */}
      <Card className="shadow-xs border bg-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Arama Kutusu */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Personel veya bölge ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/40 border-muted-foreground/20 focus:bg-background transition-colors"
              />
            </div>

            {/* Filtre Butonları */}
            <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-muted-foreground/15 self-start sm:self-auto">
              <Button
                variant={selectedFilter === 'ALL' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedFilter('ALL')}
                className="h-7 text-xs rounded-lg px-3 transition-all"
              >
                Tümü ({scans.length})
              </Button>
              <Button
                variant={selectedFilter === 'CHECK_IN' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedFilter('CHECK_IN')}
                className="h-7 text-xs rounded-lg px-3 transition-all"
              >
                Girişler
              </Button>
              <Button
                variant={selectedFilter === 'CHECK_OUT' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedFilter('CHECK_OUT')}
                className="h-7 text-xs rounded-lg px-3 transition-all"
              >
                Çıkışlar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ana Tarama Tablo/Kart Listesi */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Hareket Kayıtları</CardTitle>
              <CardDescription>
                {filteredScans.length} kayıt gösteriliyor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
                  <Skeleton className="size-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/80 mb-3 text-muted-foreground/60">
                <QrCode className="size-7" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Kayıt Bulunamadı</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {searchQuery || selectedFilter !== 'ALL'
                  ? 'Filtreleme kriterlerinize uygun hareket kaydı bulunamadı.'
                  : 'Sistemde henüz kayıtlı bir tarama hareketi yok.'}
              </p>
              {(searchQuery || selectedFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('ALL');
                  }}
                  className="mt-4 gap-2 text-xs"
                >
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredScans.map((scan) => {
                const durationText = formatDuration(scan.durationMinutes);
                const isCheckOut = scan.resolvedAction === 'CHECK_OUT';

                return (
                  <div
                    key={scan.id}
                    className="group relative flex flex-col gap-3.5 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Sol Kısım: Renkli Avatar, İsim & Görev/Bölge Detayı */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Görsel Profil Avatarı */}
                      <Avatar className="size-11 shrink-0 rounded-full border shadow-2xs ring-2 ring-background">
                        {scan.user?.avatarUrl && (
                          <AvatarImage
                            src={scan.user.avatarUrl}
                            alt={scan.user.fullName || 'Personel'}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback
                          className={`font-bold text-sm tracking-wide border ${getAvatarColorClass(
                            scan.user?.fullName
                          )}`}
                        >
                          {getInitials(scan.user?.fullName)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Personel Bilgisi & Bölge */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight group-hover:text-primary transition-colors">
                            {scan.user?.fullName || 'Bilinmeyen Personel'}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {scan.user?.role || 'PERSONEL'}
                          </Badge>
                        </div>

                        {/* Bölge Bilgisi */}
                        {scan.task?.zone ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin className="size-3.5 text-primary/70 shrink-0" />
                            <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                              {scan.task.zone.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground/80">
                              ({scan.task.zone.code})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <QrCode className="size-3.5 text-muted-foreground/60 shrink-0" />
                            <span>Genel Tarama</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sağ Kısım: Aksiyon, İçeride Kalınan Süre, Kademeli Tarih ve Risk */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-dashed border-slate-200 dark:border-slate-800">
                      
                      {/* Aksiyon & Süre Badge Alanı */}
                      <div className="flex items-center gap-2">
                        {/* Çıkış Yapıldıysa ve Süre Varsa: İçeride Kalınan Süre Badge'i */}
                        {isCheckOut && durationText && (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 font-semibold gap-1.5 px-2.5 py-1 text-xs animate-in fade-in"
                          >
                            <Hourglass className="size-3.5 text-amber-600 dark:text-amber-400" />
                            <span>İçeride: {durationText}</span>
                          </Badge>
                        )}

                        {/* Aksiyon Badge (Giriş / Çıkış) */}
                        {getActionBadge(scan.resolvedAction)}

                        {/* Risk Skoru Varsa */}
                        {scan.riskScore > 0 && (
                          <Badge variant="destructive" className="gap-1 px-2 py-0.5 text-xs font-semibold">
                            <ShieldAlert className="size-3" />
                            Risk: {scan.riskScore}
                          </Badge>
                        )}
                      </div>

                      {/* Kademeli ve Akıllı Tarih Gösterimi */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Clock className="size-3.5 text-muted-foreground/70" />
                        <span title={scan.clientScannedAt}>
                          {formatSmartDate(scan.clientScannedAt)}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
