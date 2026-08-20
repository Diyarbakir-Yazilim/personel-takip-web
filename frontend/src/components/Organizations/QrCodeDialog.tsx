"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateQr, QrPayload, Zone } from "@/services/organizations";

interface QrCodeDialogProps {
  zone: Zone | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeDialog({ zone, isOpen, onClose }: QrCodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<QrPayload | null>(null);

  useEffect(() => {
    if (isOpen && zone) {
      loadQr();
    } else {
      setPayload(null);
      setError("");
    }
  }, [isOpen, zone]);

  async function loadQr() {
    if (!zone) return;
    setLoading(true);
    setError("");
    try {
      const data = await generateQr(zone.id);
      setPayload(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    if (!zone || !payload) return;
    
    const svgContainer = document.getElementById("qr-svg-container");
    if (!svgContainer) return;

    const svgContent = svgContainer.innerHTML;
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      alert("Lütfen yazdırmak için açılır pencerelere (popups) izin verin.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR - ${zone.name}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              margin: 0; 
              background: #fff;
            }
            .card {
              text-align: center;
              border: 3px solid #000;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { margin-bottom: 8px; font-size: 28px; color: #000; }
            h2 { margin-top: 0; margin-bottom: 24px; color: #444; font-size: 20px; font-weight: 500; }
            .floor-name { font-size: 16px; color: #666; margin-bottom: 16px; }
            svg { width: 350px !important; height: 350px !important; display: block; margin: 0 auto; }
            .footer { margin-top: 24px; font-size: 14px; color: #888; border-top: 1px dashed #ccc; padding-top: 16px; }
            
            @media print {
              body { height: auto; justify-content: flex-start; margin-top: 50px; }
              .card { box-shadow: none; border: 2px dashed #666; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${zone.name}</h1>
            <h2>${zone.code}</h2>
            <div class="floor-name">
              ${zone.floor?.building?.name ? zone.floor.building.name + " - " : ""}${zone.floor?.name || ""}
            </div>
            ${svgContent}
            <div class="footer">DTSO Temizlik Takip Sistemi</div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Kod Üretildi - {zone?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>QR Kod oluşturuluyor...</p>
            </div>
          )}

          {error && (
            <div className="text-red-500 bg-red-50 p-4 rounded-md text-sm text-center">
              {error}
              <Button variant="outline" size="sm" className="mt-4 block mx-auto" onClick={loadQr}>
                Tekrar Dene
              </Button>
            </div>
          )}

          {!loading && !error && payload && (
            <div className="space-y-6 w-full">
              <div 
                id="qr-svg-container" 
                className="bg-white p-6 rounded-xl border-2 border-muted mx-auto w-fit flex justify-center items-center"
              >
                <QRCodeSVG 
                  value={JSON.stringify(payload)} 
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="font-semibold text-lg">{zone?.name}</p>
                <p className="text-sm text-muted-foreground">{zone?.code}</p>
                <p className="text-xs text-muted-foreground mt-2 px-4">
                  Bu QR kodu odanın girişine asabilirsiniz. Personel tarattığında doğrulanacaktır.
                </p>
              </div>

              <Button onClick={handlePrint} className="w-full gap-2" size="lg">
                <Printer className="h-5 w-5" />
                Çıktı Al (Yazdır)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
