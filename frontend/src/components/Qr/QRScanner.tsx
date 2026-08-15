"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type QRScannerProps = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
};

export default function QRScanner({
  onScan,
  onError,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        setStarting(true);
        setError("");
        hasScannedRef.current = false;

        const scanner = new Html5Qrcode("task-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (!mounted || hasScannedRef.current) {
              return;
            }

            hasScannedRef.current = true;

            try {
              await scanner.stop();
            } catch {
              // Scanner zaten durmuş olabilir.
            }

            onScan(decodedText);
          },
          () => {
            // QR bulunamadığında sürekli hata göstermiyoruz.
          }
        );

        if (mounted) {
          setStarting(false);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Kamera başlatılamadı.";

        setStarting(false);
        setError(message);
        onError?.(message);
      }
    };

    void startScanner();

    return () => {
      mounted = false;

      const scanner = scannerRef.current;

      if (scanner) {
        void scanner
          .stop()
          .catch(() => undefined)
          .finally(() => {
            void scanner.clear().catch(() => undefined);
          });
      }

      scannerRef.current = null;
    };
  }, [onScan, onError]);

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <Camera className="size-4" />

          <AlertTitle>Kamera açılamadı</AlertTitle>

          <AlertDescription>
            {error}
            <br />
            <span className="mt-1 block text-xs">
              Telefonda kamera iznini vermeniz ve HTTPS üzerinden
              bağlanmanız gerekir.
            </span>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl border bg-black">
            <div
              id="task-qr-reader"
              className="min-h-[300px] w-full"
            />

            {starting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="flex items-center gap-2 rounded-xl bg-background px-4 py-3 text-sm font-medium">
                  <Loader2 className="size-4 animate-spin" />
                  Kamera başlatılıyor...
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-muted/40 p-3 text-center">
            <p className="text-sm font-medium">
              QR kodu kameranın ortasına getirin
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Kod otomatik olarak okunacaktır.
            </p>
          </div>
        </>
      )}
    </div>
  );
}