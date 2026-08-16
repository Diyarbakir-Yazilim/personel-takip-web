'use client';

import dynamic from 'next/dynamic';
import StaffDailyTasks from "@/components/Tasks/StaffDailyTasks";

// SSR (Server Side Rendering) kapatılıyor, sadece istemcide (Browser) yükleniyor
const FloorPlan = dynamic(
  () => import('@/components/FloorPlan').then((mod) => mod.FloorPlan),
  { ssr: false }
);

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        <section>
          <FloorPlan />
        </section>

        <section>
          <StaffDailyTasks />
        </section>
      </div>
    </main>
  );
}