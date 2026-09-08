"use client";

import { useState} from "react";
import { FloorBreakdownItem, ZoneItem, statusColors } from "@/types/dashboard";
import { Building2, Layers, CheckCircle2, Clock, AlertCircle, X } from "lucide-react";

interface TotalZonesProps {
  selectedFloor: FloorBreakdownItem | null;
  floorBreakdown?: FloorBreakdownItem[];
  onClose: () => void;
}

export function ZonesModal({
  selectedFloor,
  floorBreakdown = [],
  onClose,
}: TotalZonesProps) {
  if (!selectedFloor) return null;

  // Grouping by buildings
  const buildingsMap = floorBreakdown.reduce((acc, item) => {
    if (!acc[item.buildingName]) {
      acc[item.buildingName] = [];
    }
    acc[item.buildingName].push(item);
    return acc;
  }, {} as Record<string, FloorBreakdownItem[]>);

  const buildings = Object.keys(buildingsMap);
  const [activeBuilding, setActiveBuilding] = useState<string>(
    selectedFloor.buildingName !== "Tüm Binalar"
      ? selectedFloor.buildingName
      : buildings[0] || ""
  );

  const currentFloors = buildingsMap[activeBuilding] || [];
  const [activeFloorName, setActiveFloorName] = useState<string>(
    selectedFloor.floorName !== "Genel Özet" && selectedFloor.buildingName === activeBuilding
      ? selectedFloor.floorName
      : currentFloors[0]?.floorName || ""
  );

  // Active floor data
  const activeFloorData =
    currentFloors.find((f) => f.floorName === activeFloorName) ||
    currentFloors[0] ||
    selectedFloor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Temizlik Alanları ve Durum Detayları
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bina ve kat bazlı operasyonel dağılım
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Bina Sekmeleri (Eğer birden fazla bina varsa) */}
        {buildings.length > 1 && (
          <div className="flex px-6 pt-4 gap-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            {buildings.map((building) => (
              <button
                key={building}
                onClick={() => {
                  setActiveBuilding(building);
                  const firstFloor = buildingsMap[building]?.[0]?.floorName;
                  if (firstFloor) setActiveFloorName(firstFloor);
                }}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeBuilding === building
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                {building}
              </button>
            ))}
          </div>
        )}

        {/* Kat Sekmeleri */}
        <div className="flex px-6 pt-3 gap-2 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          {currentFloors.map((floor) => (
            <button
              key={floor.floorName}
              onClick={() => setActiveFloorName(floor.floorName)}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeFloorName === floor.floorName
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              <Layers className="size-3.5" />
              {floor.floorName}
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                {floor.total}
              </span>
            </button>
          ))}
        </div>

        {/* Alan Listesi İçeriği */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
            <span>Seçilen Kat: <strong className="text-slate-900 dark:text-white">{activeFloorName}</strong></span>
            <span>Toplam Alan: <strong className="text-slate-900 dark:text-white">{activeFloorData.total}</strong> (Tamamlanan: {activeFloorData.completed})</span>
          </div>

          <div className="space-y-2">
            {[
              ...(activeFloorData.completedZonesList || []).map((z) => ({ ...z, groupType: "COMPLETED" })),
              ...(activeFloorData.inProgressZonesList || []).map((z) => ({ ...z, groupType: "IN_PROGRESS" })),
              ...(activeFloorData.pendingZonesList || []).map((z) => ({ ...z, groupType: "PENDING" })),
            ].length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Bu kata ait alan kaydı bulunmuyor.
              </div>
            ) : (
              [
                ...(activeFloorData.completedZonesList || []).map((z) => ({ ...z, groupType: "COMPLETED" })),
                ...(activeFloorData.inProgressZonesList || []).map((z) => ({ ...z, groupType: "IN_PROGRESS" })),
                ...(activeFloorData.pendingZonesList || []).map((z) => ({ ...z, groupType: "PENDING" })),
              ].map((zone) => {
                const statusStyle = zone.status && statusColors[zone.status as keyof typeof statusColors]
                  ? statusColors[zone.status as keyof typeof statusColors]
                  : { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100" };

                return (
                  <div
                    key={zone.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
                        {zone.groupType === "COMPLETED" ? (
                          <CheckCircle2 className="size-4" />
                        ) : zone.groupType === "IN_PROGRESS" ? (
                          <Clock className="size-4" />
                        ) : (
                          <AlertCircle className="size-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {zone.zoneName}
                        </p>
                        {zone.zoneCode && (
                          <p className="text-xs font-mono text-slate-400 mt-0.5">
                            Kod: {zone.zoneCode}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${statusStyle.badge}`}>
                      {zone.status || "BEKLİYOR"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}