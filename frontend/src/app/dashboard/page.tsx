import dynamic from 'next/dynamic';
import { LayoutDashboard } from 'lucide-react';

const FloorPlan = dynamic(
  () => import('@/components/FloorPlan').then((mod) => mod.FloorPlan),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutDashboard className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Canlı zemin planı ve bölge durumları
          </p>
        </div>
      </div>

      <FloorPlan />
    </div>
  );
}
