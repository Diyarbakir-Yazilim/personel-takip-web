'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, QrCode, Clock, MapPin, User, ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ScanEvent {
  id: string;
  clientScannedAt: string;
  requestedAction: string;
  resolvedAction: string;
  method: string;
  riskScore: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  task?: {
    zone: {
      name: string;
      code: string;
    };
  };
}

export default function ScansPage() {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const { apiRequest } = await import('@/services/apiClient');
        const res = await apiRequest('/scans?take=50');

        if (!res.success) throw new Error('Tarama geçmişi alınamadı.');
        
        const data = res.data as any;
        setScans(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchScans();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'd MMM yyyy, HH:mm', { locale: tr });
    } catch {
      return dateString;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CHECK_IN':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Giriş (Başlama)</Badge>;
      case 'CHECK_OUT':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Çıkış (Tamamlama)</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <QrCode className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarama Geçmişi</h1>
          <p className="text-sm text-muted-foreground">Personellerin QR kod okutma kayıtları</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Son Taramalar</CardTitle>
          <CardDescription>Sistemdeki en son 50 QR okutma işlemi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <QrCode className="mb-2 size-10 opacity-20" />
              <p>Henüz hiç tarama kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {scans.map((scan) => (
                <div key={scan.id} className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
                  
                  {/* Sol Kısım: Personel ve Bölge Bilgisi */}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-semibold">{scan.user.fullName}</span>
                      <span className="text-xs text-muted-foreground">({scan.user.role})</span>
                    </div>
                    
                    {scan.task?.zone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="size-4" />
                        <span>
                          <span className="font-medium text-slate-900 dark:text-slate-200">{scan.task.zone.name}</span>
                          {' '}({scan.task.zone.code})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sağ Kısım: Aksiyon, Tarih, Risk */}
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <div className="flex items-center gap-2">
                      {getActionBadge(scan.resolvedAction)}
                      {scan.riskScore > 0 && (
                        <Badge variant="destructive" className="gap-1 px-1.5">
                          <ShieldAlert className="size-3" />
                          Risk: {scan.riskScore}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {formatDate(scan.clientScannedAt)}
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
