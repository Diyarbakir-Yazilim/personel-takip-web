export interface ZoneItem {
  id: string;
  zoneName: string;
  zoneCode?: string;
  status?: string;
  buildingName?: string;
  floorName?: string;
}

export interface FloorBreakdownItem {
  buildingName: string;
  floorName: string;
  total: number;
  completed: number;
  completedZonesList?: ZoneItem[];
  inProgressZonesList?: ZoneItem[];
  pendingZonesList?: ZoneItem[];
}

export interface StaffMember {
  id: string;
  fullName: string;
  zoneName?: string;
  department?: string;
  scannedAt?: string;
}

export interface DashboardStats {
  activeStaff: number;
  totalStaff: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  flaggedTasks: number;
  missedTasks: number;
  completionRate: number;
  floorBreakdown: FloorBreakdownItem[];
  recentActivity: Array<{
    id: string;
    resolvedAction: string;
    clientScannedAt: string;
    user: { fullName: string };
    task?: { zone: { name: string; code: string } };
  }>;
  activeStaffList?: StaffMember[];
  inactiveStaffList?: StaffMember[];
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  description?: string;
  status?: "FREE" | "BUSY" | "ALERT";
}

export interface ZonesApiResponse {
  success: boolean;
  data: Zone[]; // Sadece net bir dizi kalsın
}

export const statusColors: Record<"FREE" | "BUSY" | "ALERT", {
  bg: string;
  border: string;
  text: string;
  badge: string;
}> = {
  FREE: {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/20",
    border: "border-emerald-200/80 dark:border-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  BUSY: {
    bg: "bg-amber-50/80 dark:bg-amber-950/20",
    border: "border-amber-200/80 dark:border-amber-900/50",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  ALERT: {
    bg: "bg-red-50/80 dark:bg-red-950/20",
    border: "border-red-200/80 dark:border-red-900/50",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100/80 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
};