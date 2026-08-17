'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
  id?: string;
  fullName: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/profile');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Profil bilgileri yüklenemedi.');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Profili</h1>
        <p className="text-sm text-slate-500">
          Hesabınıza ait temel bilgileri buradan görüntüleyebilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Profil Detayları</CardTitle>
          <CardDescription>Sistemde kayıtlı kullanıcı kimlik bilgileriniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            <span className="font-medium text-slate-500">Ad Soyad</span>
            <span className="md:col-span-2 text-slate-900 font-semibold">
              {profile?.fullName || '-'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            <span className="font-medium text-slate-500">E-posta Adresi</span>
            <span className="md:col-span-2 text-slate-900 font-semibold">
              {profile?.email || '-'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <span className="font-medium text-slate-500">Kullanıcı Rolü</span>
            <div className="md:col-span-2">
              <Badge variant={profile?.role === 'ADMIN' ? 'default' : 'secondary'}>
                {profile?.role || 'USER'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}