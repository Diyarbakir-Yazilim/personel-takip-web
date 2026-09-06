import { useState } from "react";
import { X, CheckCircle2, Clock, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FloorBreakdownItem, ZoneItem } from "@/app/dashboard/page";

interface FloorModalProps {
  selectedFloor: FloorBreakdownItem | null;
  onClose: () => void;
  isSingleBuilding: boolean;
}

export function FloorModal({
  selectedFloor,
  onClose,
  isSingleBuilding,
}: FloorModalProps) {
  // 1. DÜZELTME: Tüm Hook'lar (useState vb.) bileşenin en başında, her render'da 
  // kesinlikle aynı sırada çağrılmalıdır. Erken return'den ÖNCE olmalıdır.
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // 2. Erken return kontrolü artık Hook'lardan sonradır.
  if (!selectedFloor) return null;

  const completedList = selectedFloor.completedZonesList || [];
  const inProgressList = selectedFloor.inProgressZonesList || [];
  const remainingList = selectedFloor.pendingZonesList || [];

  const allZones = [...completedList, ...inProgressList, ...remainingList];
  const uniqueFloors = Array.from(
    new Set(allZones.map((z) => z.floorName).filter(Boolean))
  );

  const filteredCompleted =
    activeTab === "ALL"
      ? completedList
      : completedList.filter((z) => z.floorName === activeTab);

  const filteredInProgress =
    activeTab === "ALL"
      ? inProgressList
      : inProgressList.filter((z) => z.floorName === activeTab);

  const filteredRemaining =
    activeTab === "ALL"
      ? remainingList
      : remainingList.filter((z) => z.floorName === activeTab);

  const showCompletedFirst = filteredCompleted.length <= filteredRemaining.length;

  const formatZoneName = (zone: ZoneItem) => {
    if (activeTab === "ALL" && uniqueFloors.length > 1) {
      if (isSingleBuilding) {
        return `${zone.floorName || "Kat Yok"} - ${zone.zoneName}`;
      } else {
        return `${zone.buildingName || "Bina Yok"} / ${zone.floorName || "Kat Yok"} - ${zone.zoneName}`;
      }
    }
    return zone.zoneName;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedFloor.floorName === "Genel Özet"
                ? "Genel Özet"
                : isSingleBuilding
                ? selectedFloor.floorName
                : `${selectedFloor.buildingName} - ${selectedFloor.floorName}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Temizlik detayları ve bölge listesi
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {uniqueFloors.length > 1 && (
          <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "ALL"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Tümü ({allZones.length})
            </button>
            {uniqueFloors.map((floor) => {
              const count = allZones.filter((z) => z.floorName === floor).length;
              return (
                <button
                  key={floor}
                  onClick={() => setActiveTab(floor)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === floor
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {floor} ({count})
                </button>
              );
            })}
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5">
          
          {filteredInProgress.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Şuan Temizleniyorlar ({filteredInProgress.length})
              </h4>
              <div className="space-y-1.5">
                {filteredInProgress.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                      {formatZoneName(zone)}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 shrink-0">
                      IN_PROGRESS
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCompletedFirst ? (
            <>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Temizlenenler ({filteredCompleted.length})
                </h4>
                <div className="space-y-1.5">
                  {filteredCompleted.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                        {formatZoneName(zone)}
                      </span>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 shrink-0">
                        DONE
                      </Badge>
                    </div>
                  ))}
                  {filteredCompleted.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-1">Temizlenen alan yok.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Temizlenecekler ({filteredRemaining.length})
                </h4>
                <div className="space-y-1.5">
                  {filteredRemaining.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                        {formatZoneName(zone)}
                      </span>
                      <Badge variant="outline" className="text-[10px] text-slate-500 shrink-0">
                        PENDING
                      </Badge>
                    </div>
                  ))}
                  {filteredRemaining.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-1">Kalan alan yok.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Temizlenecekler ({filteredRemaining.length})
                </h4>
                <div className="space-y-1.5">
                  {filteredRemaining.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                        {formatZoneName(zone)}
                      </span>
                      <Badge variant="outline" className="text-[10px] text-slate-500 shrink-0">
                        PENDING
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Temizlenenler ({filteredCompleted.length})
                </h4>
                <div className="space-y-1.5">
                  {filteredCompleted.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                        {formatZoneName(zone)}
                      </span>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 shrink-0">
                        DONE
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

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

export default FloorModal;