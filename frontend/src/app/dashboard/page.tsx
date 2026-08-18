'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

export default function ReportDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>('');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Zone Summary Reports
          </h1>
          <p className="text-sm text-slate-500">
            Connected to <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">mv_daily_zone_summary</code> view
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-fit flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      {/* Filtreleme Kartı */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            Rapor Filtreleri
          </CardTitle>
          <CardDescription>Bölge özet raporlarını tarihe göre süzebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4 max-w-sm">
            <div className="space-y-2 w-full">
              <Label htmlFor="date-filter" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Tarih Seçin
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={() => setSelectedDate('')}>
              Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Veri Kartı / Tablo Alanı */}
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          Tarih seçildiğinde veriler burada listelenecektir.
        </CardContent>
      </Card>
    </div>
  );
}