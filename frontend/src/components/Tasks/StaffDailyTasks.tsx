"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CloudOff,
  Flag,
  Loader2,
  MapPin,
  Play,
  RefreshCcw,
  ClipboardList,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getStoredToken } from "@/lib/auth";
import { performTaskAction } from "@/services/apiClient";
import {
  countPendingScans,
  getPendingScans,
  QUEUE_CHANGED_EVENT,
  QUEUE_FLUSHED_EVENT,
  type PendingScan,
} from "@/services/db";
import QRScanner from "../Qr/QRScanner";

type TaskStatus =
  | "SCHEDULED"
  | "PENDING"
  | "IN_PROGRESS"
  | "DONE"
  | "MISSED"
  | "FLAGGED";

type DailyTask = {
  id: string;
  zoneCode: string;
  zoneName: string;
  status: TaskStatus;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  checklist: string[];
  checklistCount: number;
  /** Local-only flag: the shown status is optimistic, waiting for sync. */
  pendingSync?: boolean;
};

type QRAction = "start" | "complete";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "Planlandı", className: "border-slate-200 bg-slate-50 text-slate-700" },
  PENDING: { label: "Bekliyor", className: "border-amber-200 bg-amber-50 text-amber-800" },
  IN_PROGRESS: { label: "Devam Ediyor", className: "border-blue-200 bg-blue-50 text-blue-800" },
  DONE: { label: "Tamamlandı", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  MISSED: { label: "Gecikti", className: "border-red-200 bg-red-50 text-red-800" },
  FLAGGED: { label: "Kontrol Gerekli", className: "border-orange-200 bg-orange-50 text-orange-800" },
};

function formatTime(value: string | null): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

/**
 * Overlays queued-but-unsynced actions onto the task list fetched from the
 * server, so a page reload while offline still shows the optimistic state.
 */
function applyPendingOverlay(list: DailyTask[], queue: PendingScan[]): DailyTask[] {
  if (queue.length === 0) return list;

  const byTask = new Map<string, PendingScan[]>();
  for (const item of queue) {
    const items = byTask.get(item.taskId) ?? [];
    items.push(item);
    byTask.set(item.taskId, items);
  }

  return list.map((task) => {
    const items = byTask.get(task.id);
    if (!items || items.length === 0) return task;

    let next: DailyTask = { ...task, pendingSync: true };
    for (const item of items) {
      if (item.action === "start") {
        next = {
          ...next,
          status: "IN_PROGRESS",
          startedAt: next.startedAt ?? item.clientScannedAt,
        };
      } else if (item.action === "complete") {
        next = {
          ...next,
          status: "DONE",
          completedAt: next.completedAt ?? item.clientScannedAt,
        };
      } else if (item.action === "flag") {
        next = { ...next, status: "FLAGGED" };
      }
    }
    return next;
  });
}

export default function StaffDailyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const [dateLabel, setDateLabel] = useState<string>("");
  const [qrOpen, setQrOpen] = useState<boolean>(false);
  const [qrAction, setQrAction] = useState<QRAction | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const isProcessingQr = useRef<boolean>(false);

  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""),
    []
  );

  useEffect(() => {
    setDateLabel(
      new Intl.DateTimeFormat("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date())
    );
  }, []);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingCount(await countPendingScans());
    } catch {
      // IndexedDB unavailable (private mode etc.) -> ignore silently.
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const token = getStoredToken();
    if (!token) {
      setTasks([]);
      setError("Görevleri görmek için oturum açmanız gerekiyor.");
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = apiBaseUrl ? `${apiBaseUrl}/tasks/my-day` : "/api/tasks/my-day";
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Görev listesi alınamadı.");

      const data = await response.json();
      const taskList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.tasks)
        ? data.tasks
        : [];

      // Re-apply queued offline actions so a reload never "loses" them.
      let queue: PendingScan[] = [];
      try {
        queue = await getPendingScans();
      } catch {
        // IndexedDB unavailable -> show server state as-is.
      }

      setTasks(applyPendingOverlay(taskList as DailyTask[], queue));
      setPendingCount(queue.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  // Keep the pending badge in sync and refetch after a successful flush.
  useEffect(() => {
    const handleQueueChanged = () => void refreshPendingCount();
    const handleQueueFlushed = () => void loadTasks();

    window.addEventListener(QUEUE_CHANGED_EVENT, handleQueueChanged);
    window.addEventListener(QUEUE_FLUSHED_EVENT, handleQueueFlushed);

    return () => {
      window.removeEventListener(QUEUE_CHANGED_EVENT, handleQueueChanged);
      window.removeEventListener(QUEUE_FLUSHED_EVENT, handleQueueFlushed);
    };
  }, [loadTasks, refreshPendingCount]);

  const openQR = useCallback((taskId: string, action: QRAction) => {
    setActionError("");
    setSelectedTaskId(taskId);
    setQrAction(action);
    setQrOpen(true);
    isProcessingQr.current = false;
  }, []);

  const applyOptimisticUpdate = useCallback(
    (taskId: string, action: "start" | "complete" | "flag") => {
      const nowIso = new Date().toISOString();

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;

          if (action === "start") {
            return { ...task, status: "IN_PROGRESS", startedAt: nowIso, pendingSync: true };
          }
          if (action === "complete") {
            return { ...task, status: "DONE", completedAt: nowIso, pendingSync: true };
          }
          return { ...task, status: "FLAGGED", pendingSync: true };
        })
      );
    },
    []
  );

  const handleQRScan = useCallback(
    async (qrValue: string) => {
      if (!selectedTaskId || !qrAction || isProcessingQr.current) return;

      isProcessingQr.current = true;

      const taskId = selectedTaskId;
      const action = qrAction;

      setQrOpen(false);
      setActionLoading(taskId);
      setActionError("");

      try {
        const result = await performTaskAction<DailyTask>(taskId, action, {
          qrCode: qrValue,
        });

        if (result.queued) {
          // Offline: action stored in IndexedDB -> optimistic UI update.
          applyOptimisticUpdate(taskId, action);
          return;
        }

        const responseData = result.data as
          | (DailyTask & { data?: DailyTask })
          | undefined;
        const updatedTask =
          responseData && "data" in responseData && responseData.data && !Array.isArray(responseData.data)
            ? responseData.data
            : responseData;

        if (updatedTask?.id) {
          setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? (updatedTask as DailyTask) : task))
          );
        } else {
          await loadTasks();
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
      } finally {
        setActionLoading(null);
        setSelectedTaskId(null);
        setQrAction(null);
        isProcessingQr.current = false;
      }
    },
    [qrAction, selectedTaskId, loadTasks, applyOptimisticUpdate]
  );

  const handleFlag = useCallback(
    async (taskId: string) => {
      setActionLoading(taskId);
      setActionError("");

      try {
        const result = await performTaskAction<DailyTask>(taskId, "flag", {
          reason: "Manuel olarak işaretlendi",
        });

        if (result.queued) {
          applyOptimisticUpdate(taskId, "flag");
          return;
        }

        const responseData = result.data as
          | (DailyTask & { data?: DailyTask })
          | undefined;
        const updatedTask =
          responseData && "data" in responseData && responseData.data && !Array.isArray(responseData.data)
            ? responseData.data
            : responseData;

        if (updatedTask?.id) {
          setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? (updatedTask as DailyTask) : task))
          );
        } else {
          await loadTasks();
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
      } finally {
        setActionLoading(null);
      }
    },
    [loadTasks, applyOptimisticUpdate]
  );

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "SCHEDULED" || t.status === "PENDING").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = tasks.filter((t) => t.status === "DONE").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, inProgress, completed, rate };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return tasks.filter((t) => t.status === "SCHEDULED" || t.status === "PENDING");
      case "progress":
        return tasks.filter((t) => t.status === "IN_PROGRESS");
      case "done":
        return tasks.filter((t) => t.status === "DONE");
      default:
        return tasks;
    }
  }, [tasks, activeTab]);

  return (
    <section className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {dateLabel || "..."}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bugünkü Görevler</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Atanan görevlerini takip edebilir, görevleri QR kod ile başlatıp tamamlayabilirsin.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadTasks()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
          Yenile
        </Button>
      </div>

      {/* OFFLINE QUEUE INFO */}
      {pendingCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <CloudOff className="size-4" />
          <AlertTitle>Çevrimdışı işlemler bekliyor</AlertTitle>
          <AlertDescription>
            {pendingCount} işlem cihazında kayıtlı. Bağlantı sağlandığında otomatik olarak
            senkronize edilecek.
          </AlertDescription>
        </Alert>
      )}

      {/* ERRORS */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Görevler yüklenemedi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>İşlem gerçekleştirilemedi</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* LOADING SKELETON */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-4 p-5">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* STATS */}
          {!error && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Toplam</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <ClipboardList className="size-5 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Bekleyen</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{stats.pending}</span>
                    <Clock3 className="size-5 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Devam Eden</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{stats.inProgress}</span>
                    <Timer className="size-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Tamamlanan</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{stats.completed}</span>
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PROGRESS */}
          {!error && stats.total > 0 && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Günlük İlerleme</p>
                    <p className="text-xs text-muted-foreground">Tamamlanan görev oranı</p>
                  </div>
                  <span className="font-bold">%{stats.rate}</span>
                </div>
                <Progress value={stats.rate} />
              </CardContent>
            </Card>
          )}

          {/* TABS */}
          {!error && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Görev Listesi</h2>
                  <p className="text-sm text-muted-foreground">Bugün sana atanan görevler</p>
                </div>

                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all">Tümü ({stats.total})</TabsTrigger>
                  <TabsTrigger value="pending">Bekleyen ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="progress">Devam Eden ({stats.inProgress})</TabsTrigger>
                  <TabsTrigger value="done">Tamamlanan ({stats.completed})</TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-4">
                <TaskList
                  tasks={filteredTasks}
                  actionLoading={actionLoading}
                  onStart={(id) => openQR(id, "start")}
                  onComplete={(id) => openQR(id, "complete")}
                  onFlag={handleFlag}
                />
              </div>
            </Tabs>
          )}
        </>
      )}

      {/* QR DIALOG */}
      <Dialog
        open={qrOpen}
        onOpenChange={(open) => {
          setQrOpen(open);
          if (!open) {
            setSelectedTaskId(null);
            setQrAction(null);
            isProcessingQr.current = false;
          }
        }}
      >
        <DialogContent className="max-w-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {qrAction === "start" ? "Görevi Başlat" : "Görevi Tamamla"}
            </DialogTitle>
            <DialogDescription>
              {qrAction === "start"
                ? "Göreve başlamak için görev alanındaki QR kodu okutun."
                : "Görevi tamamlamak için görev alanındaki QR kodu okutun."}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-lg">
            {qrOpen && (
              <QRScanner
                onScan={handleQRScan}
                onError={(message) => setActionError(`Kamera hatası: ${message}`)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| TASK LIST COMPONENT
|--------------------------------------------------------------------------
*/

type TaskListProps = {
  tasks: DailyTask[];
  actionLoading: string | null;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onFlag: (taskId: string) => void;
};

function TaskList({
  tasks,
  actionLoading,
  onStart,
  onComplete,
  onFlag,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <ClipboardList className="mb-4 size-10 text-muted-foreground" />
          <h3 className="font-semibold">Bu kategoride görev bulunamadı</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Şu anda gösterilecek bir görev bulunmuyor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => {
        const config = STATUS_CONFIG[task.status] || {
          label: task.status,
          className: "border-gray-200 bg-gray-50 text-gray-700",
        };

        const isLoading = actionLoading === task.id;

        return (
          <Card key={task.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{task.zoneName}</CardTitle>
                    <CardDescription>{task.zoneCode}</CardDescription>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {task.pendingSync && (
                    <Badge
                      variant="outline"
                      className="w-fit gap-1 border-amber-200 bg-amber-50 text-amber-800"
                    >
                      <CloudOff className="size-3" />
                      Senkronizasyon bekliyor
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn("w-fit", config.className)}>
                    {config.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-4" />
                  {formatTime(task.scheduledFor)}
                </span>

                <span className="flex items-center gap-1.5">
                  <ClipboardList className="size-4" />
                  {task.checklistCount} kontrol
                </span>

                {task.completedAt && (
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    Tamamlandı {formatTime(task.completedAt)}
                  </span>
                )}
              </div>

              {task.checklist && task.checklist.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Kontrol Listesi
                    </p>
                    <div className="grid gap-2">
                      {task.checklist.slice(0, 4).map((item, index) => (
                        <div key={`${task.id}-${index}`} className="flex items-start gap-2 text-sm">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    {task.checklist.length > 4 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        + {task.checklist.length - 4} kontrol daha
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* ACTIONS */}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {(task.status === "SCHEDULED" || task.status === "PENDING") && (
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onStart(task.id)}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    Göreve Başla
                  </Button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onComplete(task.id)}
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Görevi Tamamla
                  </Button>
                )}

                {task.status !== "DONE" &&
                  task.status !== "MISSED" &&
                  task.status !== "FLAGGED" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => onFlag(task.id)}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Flag className="size-4" />
                      )}
                      Kontrol Gerekiyor
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
