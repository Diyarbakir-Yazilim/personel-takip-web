'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Çıkış yapılırken bir hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleLogout} 
      disabled={loading}
    >
      {loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
    </Button>
  );
}