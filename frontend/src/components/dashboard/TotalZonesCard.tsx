import { Card, CardContent } from "@/components/ui/card";
import { Eye, MapPin } from "lucide-react";
import { FloorBreakdownItem } from "@/types/dashboard";

interface TotalZonesCardProps {
  floorBreakdown: FloorBreakdownItem[];
  isEmpty: boolean;
  onOpenModal: () => void;
}

export function TotalZonesCard({
  floorBreakdown,
  isEmpty,
  onOpenModal,
}: TotalZonesCardProps) {
  const totalZones =
    floorBreakdown?.reduce((acc, curr) => acc + curr.total, 0) || 0;

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-[#34D399] dark:bg-slate-900/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Toplam Temizlik Alanı
          </p>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <MapPin className="size-5" />
          </div>
        </div>

        <div className="p-4 mt-4 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {totalZones}
          </span>
                      
        </div>

          <button
            onClick={onOpenModal}
            disabled={isEmpty}
            className="mt-1 w-full py-1.5 px-3 bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 backdrop-blur-sm border border-white/20 shadow-sm"
        >
          <MapPin className="size-3.5" />
          Detay Gör
          </button>
        
      </CardContent>
    </Card>
  );
}