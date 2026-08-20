'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { apiRequest } from '@/services/apiClient';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await apiRequest('/scans?skip=0&take=5000');
      
      if (!response.success) {
        throw new Error('Veriler sunucudan alınamadı.');
      }

      const data = response.data as any;
      const scans = Array.isArray(data) ? data : (data?.data || []);

      if (scans.length === 0) {
        throw new Error('Dışa aktarılacak herhangi bir veri bulunamadı.');
      }

      // Excel için verileri formatlayalım
      const excelData = scans.map((scan: any) => {
        return {
          'Tarih / Saat': new Date(scan.clientScannedAt).toLocaleString('tr-TR'),
          'Personel Adı': scan.user?.fullName || 'Bilinmiyor',
          'Personel Rolü': scan.user?.role || '-',
          'Bölge Adı': scan.task?.zone?.name || '-',
          'Bölge Kodu': scan.task?.zone?.code || '-',
          'İşlem (Kayıtlı)': scan.resolvedAction === 'CHECK_IN' ? 'Görev Başladı' : scan.resolvedAction === 'CHECK_OUT' ? 'Görev Bitti' : scan.resolvedAction,
          'Risk Puanı': scan.riskScore,
          'Kök İzinsiz (Root)': scan.deviceIntegrity?.isRooted ? 'Evet' : 'Hayır',
          'Sahte Konum (Mock)': scan.deviceIntegrity?.isMockLocation ? 'Evet' : 'Hayır',
        };
      });

      // 1. Çalışma kitabı ve sayfası oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Sütun genişliklerini ayarla (opsiyonel)
      const wscols = [
        { wch: 20 }, // Tarih
        { wch: 25 }, // Personel Adı
        { wch: 15 }, // Rol
        { wch: 25 }, // Bölge Adı
        { wch: 15 }, // Bölge Kodu
        { wch: 20 }, // İşlem
        { wch: 12 }, // Risk
        { wch: 15 }, // Root
        { wch: 15 }, // Sahte Konum
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Denetim Kayıtları');

      // 2. İndirme işlemini başlat
      XLSX.writeFile(workbook, `Denetim_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccessMsg('Excel dosyası başarıyla indirildi.');

    } catch (err: any) {
      setError(err.message || 'Excel oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <section className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raporlar ve Dışa Aktarım</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sistemdeki görev ve denetim (QR okutma) kayıtlarını filtreleyip bilgisayarınıza Excel (.xlsx) formatında indirebilirsiniz.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
          <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>Başarılı</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <CardHeader className="bg-slate-50/50 pb-6 pt-6 dark:bg-slate-900/20">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="size-7" />
            </div>
            <div>
              <CardTitle className="text-xl">Tüm Denetim Kayıtları</CardTitle>
              <CardDescription className="mt-1.5 text-sm">
                Son 5000 QR okutma ve görev kayıtlarını içeren tam kapsamlı rapor.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-slate-400"></span>
                Personel bilgileri ve rolleri
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-slate-400"></span>
                Bölge ve görev konumları
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-slate-400"></span>
                QR cihaz güvenliği (Risk skorları, Root/Mock algılama)
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-slate-400"></span>
                Görev başlama ve bitirme zaman damgaları
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col items-center justify-end gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={handleExport}
              disabled={isLoading}
              className="w-full gap-2 rounded-xl text-base font-semibold transition-transform active:scale-[0.98] sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Download className="size-5" />
              )}
              {isLoading ? 'Rapor Hazırlanıyor...' : 'Excel Olarak İndir (.xlsx)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
