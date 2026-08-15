import React from 'react';

export default function ReportDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Daily Zone Summary Reports</h1>
      <p>This dashboard is connected to the mv_daily_zone_summary materialized view.</p>
      {/* Filtering components will go here */}
      <div className="mt-4 border p-4">
        <label>Filter by Date: <input type="date" className="border" /></label>
      </div>
    </div>
  );
}
