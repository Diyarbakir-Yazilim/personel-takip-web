import FloorPlan from '@/components/FloorPlan';

export default function FloorPlanPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-white mb-6">Canlı Takip Sistemi</h1>
      <FloorPlan />
    </main>
  );
}