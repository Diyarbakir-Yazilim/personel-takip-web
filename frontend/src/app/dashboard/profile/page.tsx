'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, ShieldCheck, AlertCircle, ChevronRight, Eye, EyeOff, Lock, UserPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
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

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/proxy/auth/profile', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Oturum bilgisi alınamadı veya süresi doldu.');
      }

      const data = await res.json();
      const user = data?.data || data;
      setProfile(user);
      setFormFullName(user?.fullName || user?.name || '');
      setFormEmail(user?.email || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/proxy/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName: formFullName, email: formEmail }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Profil güncellenemedi.');
      }

      const data = await res.json();
      const updatedUser = data?.user || data?.data || data;
      
      setProfile(updatedUser);
      setFormFullName(updatedUser?.fullName || updatedUser?.name || '');
      setFormEmail(updatedUser?.email || '');
      setIsEditProfileOpen(false);

      await fetchProfile();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Güncelleme sırasında bir hata oluştu.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }

    try {
      const res = await fetch('/api/proxy/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Şifre güncellenirken bir hata oluştu.');
      }

      alert('Şifreniz başarıyla güncellendi.');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu.');
    }
  };

  const displayName = profile?.fullName || profile?.name;
  const displayEmail = profile?.email;

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="mx-auto max-w-2xl w-full space-y-8 pb-6 pt-4">
      <Card className="border-none shadow-md bg-card/50 backdrop-blur">
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center space-y-4">
          {isLoading && !profile ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src="" alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {profile ? getInitials(displayName) : <User className="size-10" />}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="text-center space-y-1.5">
            {isLoading && !profile ? (
              <Skeleton className="mx-auto h-8 w-48" />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {displayName}
              </h1>
            )}

            {isLoading && !profile ? (
              <Skeleton className="mx-auto h-5 w-32 mt-2" />
            ) : (
              <p className="text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Mail className="size-4" />
                {displayEmail}
              </p>
            )}
          </div>

          {profile && (
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

      <div className="space-y-4">
        <h3 className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hesap Ayarları</h3>

        <Card className="shadow-sm">
          <CardContent className="p-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditProfileOpen(true)}
              className="w-full justify-start h-14 px-4 font-normal hover:bg-slate-100 dark:hover:bg-slate-800/50"
            >
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

            <Button
              variant="ghost"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full justify-start h-14 px-4 font-normal hover:bg-slate-100 dark:hover:bg-slate-800/50"
            >
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

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-inner">
                <UserPen className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Kişisel Bilgileri Düzenle</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Adınızı veya e-posta adresinizi güncelleyebilirsiniz.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ad Soyad</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="Adınızı ve soyadınızı girin"
                className="bg-background/50 focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-posta Adresi</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="E-posta adresinizi girin"
                className="bg-background/50 focus-visible:ring-blue-500"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsEditProfileOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shadow-inner">
                <Lock className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Şifre Değiştir</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Güvenliğiniz için güçlü bir şifre seçtiğinizden emin olun.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mevcut Şifre</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifrenizi girin"
                  className="pr-10 bg-background/50 focus-visible:ring-purple-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Yeni Şifre</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="pr-10 bg-background/50 focus-visible:ring-purple-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Yeni Şifre (Tekrar)</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yeni şifrenizi tekrar girin"
                  className="pr-10 bg-background/50 focus-visible:ring-purple-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                Şifreyi Güncelle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}