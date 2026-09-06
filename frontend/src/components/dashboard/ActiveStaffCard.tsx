import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users } from "lucide-react";

interface ActiveStaffCardProps {
  activeStaff: number;
  totalStaff: number;
  onOpenModal: () => void;
}

export function ActiveStaffCard({ activeStaff, totalStaff, onOpenModal }: ActiveStaffCardProps) {
  return (
    <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white relative overflow-hidden flex flex-col justify-between">
      <div className="absolute -right-4 -bottom-4 size-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <CardContent className="py-3 px-3.5 relative z-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Aktif Personel
            </p>
            <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm text-white">
              <Activity className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold tracking-tight">
              {activeStaff} / {totalStaff}
            </span>
            <span className="text-[10px] font-medium text-white/70">
              Bugün QR tarayanlar
            </span>
          </div>
        </div>

        <button
          onClick={onOpenModal}
          className="mt-3 w-full py-1.5 px-3 bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 backdrop-blur-sm border border-white/20 shadow-sm"
        >
          <Users className="size-3.5" />
          Detay Gör
        </button>
      </CardContent>
    </Card>
  );
}