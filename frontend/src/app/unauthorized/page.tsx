'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
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
          <p className="text-sm text-slate-600">
            Farklı bir hesapla giriş yapmak veya panelinize dönmek için aşağıdaki bağlantıyı kullanabilirsiniz.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard'a Dön</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}