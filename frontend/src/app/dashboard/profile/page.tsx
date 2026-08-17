'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, ShieldCheck, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'STAFF' | 'SUPERVISOR' | 'ADMIN';
  createdAt: string;
}

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  ADMIN: { label: 'Yönetici', variant: 'destructive' },
  SUPERVISOR: { label: 'Süpervizör', variant: 'default' },
  STAFF: { label: 'Personel', variant: 'secondary' },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Oturum bulunamadı.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/proxy/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Profil bilgisi alınamadı.');

        const data = await res.json();
        setProfile(data?.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profilim</h1>
          <p className="text-sm text-muted-foreground">Hesap bilgileriniz</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kullanıcı Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-24" />
            </>
          ) : profile ? (
            <>
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{profile.fullName}</span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{profile.email}</span>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <Badge variant={roleLabels[profile.role]?.variant ?? 'secondary'}>
                  {roleLabels[profile.role]?.label ?? profile.role}
                </Badge>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
