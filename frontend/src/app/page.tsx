import StaffDailyTasks from "@/components/Tasks/StaffDailyTasks";

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <StaffDailyTasks />
      </div>
    </main>
  );
}