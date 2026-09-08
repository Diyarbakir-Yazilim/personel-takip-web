import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye } from "lucide-react";
import { FloorBreakdownItem, ZoneItem } from "@/types/dashboard"

interface FloorBreakdownCardProps {
  floorBreakdown: FloorBreakdownItem[];
  isEmpty: boolean;
  isSingleBuilding?: boolean;
  onOpenModal: (summaryFloor: FloorBreakdownItem) => void;
}

export function FloorBreakdownCard({
  floorBreakdown,
  isEmpty,
  isSingleBuilding,
  onOpenModal,
}: FloorBreakdownCardProps) {
  const totalCompleted =
    floorBreakdown?.reduce((acc, curr) => acc + curr.completed, 0) || 0;
  const totalTasks =
    floorBreakdown?.reduce((acc, curr) => acc + curr.total, 0) || 0;
  const percentage =
    totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Tüm katların bölgelerini tek bir listede birleştirerek genel özet modalını açar
  const handleOpenClick = () => {
    if (!floorBreakdown) return;
    const allCompletedZones: ZoneItem[] = floorBreakdown.flatMap(
      (f) => f.completedZonesList || []
    );
    const allInProgressZones: ZoneItem[] = floorBreakdown.flatMap(
      (f) => f.inProgressZonesList || []
    );
    const allPendingZones: ZoneItem[] = floorBreakdown.flatMap(
      (f) => f.pendingZonesList || []
    );

    const summaryItem: FloorBreakdownItem = {
      buildingName: "Tüm Binalar",
      floorName: "Genel Özet",
      total: totalTasks,
      completed: totalCompleted,
      completedZonesList: allCompletedZones,
      inProgressZonesList: allInProgressZones,
      pendingZonesList: allPendingZones,
    };

    onOpenModal(summaryItem);
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-[#34D399] dark:bg-slate-900/80 backdrop-blur-sm flex flex-col justify-between">
      <CardContent className="py-5 px-6 space-y-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-black dark:text-slate-400">
              {isSingleBuilding ? "Kat İlerlemesi" : "Bina ve Kat İlerlemesi"}
            </p>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              %{percentage} Tamamlandı
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {totalCompleted}
              </span>
              <span className="text-xl font-bold text-black dark:text-slate-500 ml-1">
                / {totalTasks}
              </span>
            </div>
            <span className="text-xs text-black">Toplam Temizlik</span>
          </div>

          <Progress
            value={percentage}
            className="h-2 rounded-full mt-3 bg-slate-100 dark:bg-slate-800"
          />
        </div>

        <button
          onClick={handleOpenClick}
          disabled={isEmpty}
          className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm disabled:opacity-50"
        >
          <Eye className="size-3.5" />
          Detay Gör
        </button>
      </CardContent>
    </Card>
  );
}