import { test, expect } from '@playwright/test';

test.describe('PWA & Manifest E2E Tests', () => {

  test('manifest.json dosyası erişilebilir olmalı ve doğru meta verileri içermeli', async ({ request }) => {
    // 1. Manifest dosyasına doğrudan HTTP isteği atalım
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    
    // 2. Zorunlu PWA alanlarını doğrulayalım
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('HTML başlığında manifest bağlantısı tanımlı olmalı', async ({ page }) => {
    await page.goto('/');

    // <link rel="manifest"> etiketini kontrol edelim
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  });

  test('Service Worker başarıyla kaydedilmeli', async ({ page }) => {
    await page.goto('/');

    // Service Worker'ın tescil edilip aktifleşmesini bekleyelim
    const isRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;

      try {
        // SW'nin hazıra geçmesini 3 saniye boyunca bekle
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(() => resolve(null), 3000))
        ]);

        if (registration) return true;

        // Alternatif olarak mevcut kayıtları doğrula
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      } catch {
        return false;
      }
    });

    expect(isRegistered).toBe(true);
  });

});