'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, ShieldCheck, AlertCircle, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
  const router = useRouter();
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

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'role=; path=/; max-age=0';
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="mx-auto max-w-2xl w-full space-y-8 pb-6 pt-4">
      {/* Profil Başlığı */}
      <Card className="border-none shadow-md bg-card/50 backdrop-blur">
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src="" alt={profile?.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {profile ? getInitials(profile.fullName) : <User className="size-10" />}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="text-center space-y-1.5">
            {isLoading ? (
              <Skeleton className="mx-auto h-8 w-48" />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {profile?.fullName}
              </h1>
            )}
            
            {isLoading ? (
              <Skeleton className="mx-auto h-5 w-32 mt-2" />
            ) : (
              <p className="text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Mail className="size-4" />
                {profile?.email}
              </p>
            )}
          </div>
          
          {!isLoading && profile && (
            <Badge variant={roleLabels[profile.role]?.variant ?? 'secondary'} className="px-4 py-1 text-xs uppercase tracking-widest font-semibold mt-4">
              {roleLabels[profile.role]?.label ?? profile.role}
            </Badge>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Hesap Ayarları */}
      <div className="space-y-4">
        <h3 className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hesap Ayarları</h3>
        
        <Card className="shadow-sm">
          <CardContent className="p-2">
            <Button variant="ghost" className="w-full justify-start h-14 px-4 font-normal hover:bg-slate-100 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-4 w-full">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <User className="size-5" />
                </div>
                <div className="flex flex-col items-start flex-1 text-left">
                  <span className="text-sm font-semibold">Kişisel Bilgiler</span>
                  <span className="text-xs text-muted-foreground">Ad, e-posta ve iletişim bilgileri</span>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </Button>
            
            <Separator className="my-1" />
            
            <Button variant="ghost" className="w-full justify-start h-14 px-4 font-normal hover:bg-slate-100 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-4 w-full">
                <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="flex flex-col items-start flex-1 text-left">
                  <span className="text-sm font-semibold">Güvenlik ve Şifre</span>
                  <span className="text-xs text-muted-foreground">Şifre değiştirme ve giriş yöntemleri</span>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Diğer */}
      <div className="space-y-4 pt-4">
        <h3 className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Diğer</h3>
        
        <Card className="shadow-sm border-destructive/20 bg-destructive/5">
          <CardContent className="p-2">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start h-14 px-4 font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <LogOut className="size-5" />
                </div>
                <div className="flex flex-col items-start flex-1 text-left">
                  <span className="text-sm font-semibold">Çıkış Yap</span>
                  <span className="text-xs opacity-80">Geçerli oturumu sonlandır</span>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
