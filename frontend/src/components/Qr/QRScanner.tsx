"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    let stopped = false;

    const startScanner = async () => {
      try {
        setError("");

        // Kameraları bul
        const cameras = await Html5Qrcode.getCameras();

        console.log("Bulunan kameralar:", cameras);

        if (!cameras || cameras.length === 0) {
          throw new Error("Hiç kamera bulunamadı.");
        }

        // Önce arka kamerayı bulmaya çalış
        const backCamera =
          cameras.find((camera) =>
            camera.label.toLowerCase().includes("back")
          ) ||
          cameras.find((camera) =>
            camera.label.toLowerCase().includes("environment")
          ) ||
          cameras[cameras.length - 1];

        console.log("Seçilen kamera:", backCamera);

        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        if (stopped) return;

        await scanner.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            console.log("QR OKUNDU:", decodedText);
            setResult(decodedText);
          },
          () => {
            // QR bulunamadığında hiçbir şey yapma
          }
        );
      } catch (err) {
        console.error("QR kamera başlatma hatası:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Kamera başlatılamadı."
        );
      }
    };

    startScanner();

    return () => {
      stopped = true;

      if (scanner) {
        scanner
          .stop()
          .then(() => {
            scanner?.clear();
          })
          .catch(() => {});
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-md">
        <div
          id="qr-reader"
          className="overflow-hidden rounded-2xl"
        />
      </div>

      {error && (
        <div className="w-full max-w-md rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <strong>Kamera hatası:</strong>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="w-full max-w-md rounded-xl border bg-white p-4 shadow">
          <h2 className="mb-2 text-lg font-bold">
            ✅ QR Okundu
          </h2>

          <p className="break-all">
            {result}
          </p>
        </div>
      )}
    </main>
  );
}