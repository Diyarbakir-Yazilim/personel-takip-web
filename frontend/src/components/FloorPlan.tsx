'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ZoneData {
  zoneId: string;
  status: 'vacant' | 'occupied' | 'maintenance' | 'alert';
  occupantCount?: number;
}

const statusColors = {
  vacant: '#22c55e',      // Yeşil (Boş)
  occupied: '#ef4444',    // Kırmızı (Dolu)
  maintenance: '#eab308', // Sarı (Bakımda)
  alert: '#a855f7',       // Mor (Alarm/Kritik)
  default: '#94a3b8',     // Gri (Bilinmeyen)
};

export default function FloorPlan() {
  const [zones, setZones] = useState<Record<string, ZoneData>>({
    'zone-1': { zoneId: 'zone-1', status: 'vacant' },
    'zone-2': { zoneId: 'zone-2', status: 'occupied' },
    'zone-3': { zoneId: 'zone-3', status: 'maintenance' },
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // NestJS WebSocket Gateway namespace (/events) bağlantısı
    const socket: Socket = io('http://localhost:5000/events', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    // Sunucudan gelen bölge durum güncellemesini dinle
    socket.on('zoneStatusChanged', (data: ZoneData) => {
      setZones((prev) => ({
        ...prev,
        [data.zoneId]: data,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Test amaçlı manuel durum değiştirme tetikleyicisi
  const triggerTestUpdate = (zoneId: string, status: ZoneData['status']) => {
    const socket = io('http://localhost:5000/events');
    socket.emit('updateZoneStatus', { zoneId, status });
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-xl max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Canlı Kat Planı (Live Floor Plan)</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-slate-400">
            {isConnected ? 'Bağlı (Live)' : 'Bağlantı Kesildi'}
          </span>
        </div>
      </div>

      {/* SVG Kat Planı Alanı */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-center items-center">
        <svg viewBox="0 0 600 400" className="w-full max-w-2xl h-auto">
          {/* Arka Plan / Çerçeve */}
          <rect x="10" y="10" width="580" height="380" fill="#1e293b" rx="10" stroke="#334155" strokeWidth="2" />

          {/* Zone 1 */}
          <g className="cursor-pointer" onClick={() => triggerTestUpdate('zone-1', zones['zone-1']?.status === 'vacant' ? 'occupied' : 'vacant')}>
            <rect
              x="30"
              y="30"
              width="160"
              height="160"
              fill={statusColors[zones['zone-1']?.status || 'default']}
              rx="6"
              className="transition-colors duration-300 hover:opacity-80"
            />
            <text x="110" y="115" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">
              Zone 1
            </text>
            <text x="110" y="135" fill="#e2e8f0" fontSize="12" textAnchor="middle">
              {zones['zone-1']?.status.toUpperCase()}
            </text>
          </g>

          {/* Zone 2 */}
          <g className="cursor-pointer" onClick={() => triggerTestUpdate('zone-2', zones['zone-2']?.status === 'occupied' ? 'vacant' : 'occupied')}>
            <rect
              x="210"
              y="30"
              width="360"
              height="160"
              fill={statusColors[zones['zone-2']?.status || 'default']}
              rx="6"
              className="transition-colors duration-300 hover:opacity-80"
            />
            <text x="390" y="115" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">
              Zone 2 (Ana Salon)
            </text>
            <text x="390" y="135" fill="#e2e8f0" fontSize="12" textAnchor="middle">
              {zones['zone-2']?.status.toUpperCase()}
            </text>
          </g>

          {/* Zone 3 */}
          <g className="cursor-pointer" onClick={() => triggerTestUpdate('zone-3', zones['zone-3']?.status === 'maintenance' ? 'vacant' : 'maintenance')}>
            <rect
              x="30"
              y="210"
              width="540"
              height="160"
              fill={statusColors[zones['zone-3']?.status || 'default']}
              rx="6"
              className="transition-colors duration-300 hover:opacity-80"
            />
            <text x="300" y="295" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">
              Zone 3 (Toplantı Odası)
            </text>
            <text x="300" y="315" fill="#e2e8f0" fontSize="12" textAnchor="middle">
              {zones['zone-3']?.status.toUpperCase()}
            </text>
          </g>
        </svg>
      </div>

      <p className="text-xs text-slate-500 mt-3 text-center">
        İpucu: SVG üzerindeki alanlara tıklayarak anlık durum değişimi tetikleyebilir ve renk değişimini gözlemleyebilirsin.
      </p>
    </div>
  );
}