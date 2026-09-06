"use client";

import { Users } from "lucide-react";
import { StaffMember } from "@/app/..."; // Projenizdeki tip tanımının yoluna göre düzenleyin

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalStaff: number;
  activeStaff: number;
  activeStaffList?: StaffMember[];
  inactiveStaffList?: StaffMember[];
}

export function StaffModal({
  isOpen,
  onClose,
  totalStaff,
  activeStaff,
  activeStaffList,
  inactiveStaffList,
}: StaffModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Başlık */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Users className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Personel Katılım Durumu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                QR kod okutma ve işe başlama listesi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal İçerik */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* ÜST KISIM: QR Okutmayanlar / İşe Başlamayanlar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  QR Okutmayan / İşe Başlamayanlar
                </h4>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                {inactiveStaffList?.length || totalStaff - activeStaff} Kişi
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-44 overflow-y-auto">
              {inactiveStaffList && inactiveStaffList.length > 0 ? (
                inactiveStaffList.map((person, idx) => (
                  <div
                    key={person.id || idx}
                    className="px-4 py-2.5 flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {person.fullName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {person.department || "Personel"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {totalStaff - activeStaff === 0
                    ? "Harika! Tüm personel QR kod okuttu ve işe başladı."
                    : "Detaylı liste sağlanmadı (Toplam sayı eksik personeli gösteriyor)."}
                </div>
              )}
            </div>
          </div>

          {/* ALT KISIM: QR Okutanlar / Aktif Personel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  QR Okutan / Aktif Personel
                </h4>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                {activeStaffList?.length || activeStaff} Kişi
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-44 overflow-y-auto">
              {activeStaffList && activeStaffList.length > 0 ? (
                activeStaffList.map((person, idx) => (
                  <div
                    key={person.id || idx}
                    className="px-4 py-2.5 flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {person.fullName}
                      </span>
                      {person.zoneName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Görev Yeri: {person.zoneName}
                        </p>
                      )}
                    </div>
                    {person.scannedAt && (
                      <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        {person.scannedAt}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {activeStaff > 0
                    ? `${activeStaff} personel aktif olarak çalışıyor.`
                    : "Henüz bugün QR kod okutan personel bulunmuyor."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Alt Kısım */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}