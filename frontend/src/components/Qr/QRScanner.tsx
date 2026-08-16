"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type QRScannerProps = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
};

export default function QRScanner({
  onScan,
  onError,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);
  const startingRef = useRef(false);
  const runningRef = useRef(false);
  const scannedRef = useRef(false);

  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    mountedRef.current = true;
    scannedRef.current = false;

    let scanner: Html5Qrcode | null = null;
    let cancelled = false;

    const startScanner = async () => {
      if (startingRef.current) {
        return;
      }

      startingRef.current = true;

      try {
        setStarting(true);
        setError("");

        const element = document.getElementById(
          "task-qr-reader"
        );

        if (!element) {
          throw new Error(
            "QR kamera alanı bulunamadı."
          );
        }

        scanner = new Html5Qrcode(
          "task-qr-reader"
        );

        scannerRef.current = scanner;

        if (cancelled || !mountedRef.current) {
          try {
            scanner.clear();
          } catch {
            // Sessizce geç.
          }

          return;
        }

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
            if (
              cancelled ||
              !mountedRef.current ||
              scannedRef.current
            ) {
              return;
            }

            scannedRef.current = true;

            if (runningRef.current) {
              runningRef.current = false;

              try {
                await scanner?.stop();
              } catch {
                // Kamera zaten durmuş olabilir.
              }

              try {
                scanner?.clear();
              } catch {
                // Scanner zaten temizlenmiş olabilir.
              }
            }

            if (
              !cancelled &&
              mountedRef.current
            ) {
              onScanRef.current(decodedText);
            }
          },
          () => {
            // QR bulunamadığında hata göstermiyoruz.
          }
        );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          try {
            await scanner.stop();
          } catch {
            // Sessizce geç.
          }

          try {
            scanner.clear();
          } catch {
            // Sessizce geç.
          }

          return;
        }

        runningRef.current = true;
        setStarting(false);
      } catch (err) {
        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Kamera başlatılamadı.";

        runningRef.current = false;
        setStarting(false);
        setError(message);

        onErrorRef.current?.(message);
      } finally {
        startingRef.current = false;
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      mountedRef.current = false;

      const currentScanner =
        scannerRef.current;

      scannerRef.current = null;

      if (!currentScanner) {
        startingRef.current = false;
        return;
      }

      if (runningRef.current) {
        runningRef.current = false;

        void currentScanner
          .stop()
          .catch(() => undefined)
          .finally(() => {
            try {
              currentScanner.clear();
            } catch {
              // Sessizce geç.
            }

            startingRef.current = false;
          });
      } else {
        try {
          currentScanner.clear();
        } catch {
          // Scanner henüz başlamadıysa sessizce geç.
        }

        startingRef.current = false;
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <Camera className="size-4" />

          <AlertTitle>
            Kamera açılamadı
          </AlertTitle>

          <AlertDescription>
            {error}

            <br />

            <span className="mt-1 block text-xs">
              Telefonda kamera iznini vermeniz ve
              HTTPS üzerinden bağlanmanız gerekir.
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