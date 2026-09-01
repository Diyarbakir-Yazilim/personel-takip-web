'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            403 - Yetkisiz Erişim
          </CardTitle>
          <CardDescription>
            Bu sayfayı görüntülemek için gerekli yetkilere sahip değilsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Farklı bir hesapla giriş yapmak veya panelinize dönmek için aşağıdaki bağlantıları kullanabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">Dashboarda Dön</Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full">Farklı Hesapla Giriş Yap</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}