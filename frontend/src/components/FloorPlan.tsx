'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type ZoneStatus = 'FREE' | 'BUSY' | 'ALERT';

interface ZoneData {
  [zoneId: string]: ZoneStatus;
}

const statusColors: Record<ZoneStatus, string> = {
  FREE: '#22c55e',  // Yeşil
  BUSY: '#f59e0b',  // Turuncu
  ALERT: '#ef4444', // Kırmızı
};

export const FloorPlan: React.FC = () => {
  const [zones, setZones] = useState<ZoneData>({
    'zone-a': 'FREE',
    'zone-b': 'FREE',
    'zone-c': 'FREE',
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Backend portu 5000 üzerinden WebSocket bağlantısını başlatıyoruz
    const socket: Socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket bağlantısı başarılı:', socket.id);
    });

    socket.on('zoneStatusUpdate', (data: { zoneId: string; status: ZoneStatus }) => {
      setZones((prev) => ({
        ...prev,
        [data.zoneId]: data.status,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Doğrudan arayüzden WebSocket eventi fırlatmak için yardımcı fonksiyon
  const triggerZoneStatus = (zoneId: string, status: ZoneStatus) => {
    if (socketRef.current) {
      socketRef.current.emit('updateZoneStatus', { zoneId, status });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Canlı Kat Planı Takibi</h2>
      
      {/* Legend / Renk Açıklamaları */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-green-500 inline-block"></span>
          <span className="text-sm">Boş (FREE)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-amber-500 inline-block"></span>
          <span className="text-sm">Meşgul (BUSY)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
          <span className="text-sm">Acil / Uyarı (ALERT)</span>
        </div>
      </div>

      {/* Dynamic SVG Floor Plan */}
      <svg width="600" height="400" viewBox="0 0 600 400" className="border border-slate-700 rounded-lg bg-slate-800 mb-6">
        {/* Zone A */}
        <g id="zone-a">
          <rect
            x="50"
            y="50"
            width="220"
            height="140"
            rx="8"
            fill={statusColors[zones['zone-a'] || 'FREE']}
            className="transition-colors duration-500 ease-in-out cursor-pointer opacity-90 hover:opacity-100"
          />
          <text x="160" y="125" fill="#fff" fontWeight="bold" fontSize="16" textAnchor="middle">Bölge A</text>
        </g>

        {/* Zone B */}
        <g id="zone-b">
          <rect
            x="310"
            y="50"
            width="240"
            height="140"
            rx="8"
            fill={statusColors[zones['zone-b'] || 'FREE']}
            className="transition-colors duration-500 ease-in-out cursor-pointer opacity-90 hover:opacity-100"
          />
          <text x="430" y="125" fill="#fff" fontWeight="bold" fontSize="16" textAnchor="middle">Bölge B</text>
        </g>

        {/* Zone C */}
        <g id="zone-c">
          <rect
            x="50"
            y="220"
            width="500"
            height="130"
            rx="8"
            fill={statusColors[zones['zone-c'] || 'FREE']}
            className="transition-colors duration-500 ease-in-out cursor-pointer opacity-90 hover:opacity-100"
          />
          <text x="300" y="290" fill="#fff" fontWeight="bold" fontSize="16" textAnchor="middle">Bölge C (Ana Koridor)</text>
        </g>
      </svg>

      {/* Ekran Üzerinden Test Paneli */}
      <div className="flex flex-wrap justify-center gap-3 bg-slate-800 p-4 rounded-lg border border-slate-700 w-full max-w-[600px]">
        <span className="w-full text-center text-xs text-slate-400 font-semibold mb-1">CANLI TEST TETİKLEYİCİLERİ</span>
        <button
          onClick={() => triggerZoneStatus('zone-a', 'ALERT')}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-xs font-semibold rounded transition"
        >
          Bölge A: Acil (ALERT)
        </button>
        <button
          onClick={() => triggerZoneStatus('zone-b', 'BUSY')}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-xs font-semibold rounded transition"
        >
          Bölge B: Meşgul (BUSY)
        </button>
        <button
          onClick={() => triggerZoneStatus('zone-a', 'FREE')}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-xs font-semibold rounded transition"
        >
          Bölge A: Boş (FREE)
        </button>
        <button
          onClick={() => triggerZoneStatus('zone-c', 'BUSY')}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-xs font-semibold rounded transition"
        >
          Bölge C: Meşgul (BUSY)
        </button>
      </div>
    </div>
  );
};