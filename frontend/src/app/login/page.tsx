'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Droplet, Loader2, AlertCircle, Lock, Mail, Eye, EyeOff } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Giriş başarısız.');
      }

      const accessToken = data?.access_token
      const role = data?.user?.role || data?.role;

      if (accessToken) {
        document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
        if (role) {
          document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
        localStorage.setItem('access_token', accessToken);
      }

      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/40 dark:border-zinc-800/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="size-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
          <Droplet className="size-8 fill-white/20 animate-pulse" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Temizlik Takip Sistemi
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">E-posta Adresi</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input
              id="email"
              type="email"
              placeholder="ornek@personel.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800 focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Şifre</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="pl-10 pr-10 h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800 focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          id="login-submit"
          type="submit"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            'Sisteme Giriş Yap'
          )}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-cyan-500" />
      </main>
    );
  }

  return (
    <main 
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/foam-drops1.jpg')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/40 via-black/30 to-blue-900/40 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={
          <div className="flex justify-center p-12">
            <Loader2 className="size-8 animate-spin text-cyan-500" />
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}