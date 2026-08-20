"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
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

import { apiRequest } from "@/services/apiClient";

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

export default function StaffDailyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [dateLabel, setDateLabel] = useState<string>("");
  const [qrOpen, setQrOpen] = useState<boolean>(false);
  const [qrAction, setQrAction] = useState<QRAction | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

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

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const endpoint = "/tasks/my-day";
      const response = await apiRequest(endpoint);

      if (!response.success) throw new Error("Görev listesi alınamadı.");

      const data = response.data as Record<string, unknown>;
      const taskList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.tasks)
        ? data.tasks
        : [];

      setTasks(taskList as DailyTask[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const openQR = useCallback((taskId: string, action: QRAction) => {
    setActionError("");
    setSelectedTaskId(taskId);
    setQrAction(action);
    setQrOpen(true);
    isProcessingQr.current = false;
  }, []);

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
        const endpoint = `/tasks/${taskId}/${action}`;
        const response = await apiRequest(endpoint, {
          method: "PATCH",
          body: { qrCode: qrValue },
        });

        if (!response.success) {
          throw new Error("İşlem başarısız.");
        }

        const responseData = response.data as Record<string, unknown>;
        const updatedTask =
          responseData?.data && !Array.isArray(responseData.data)
            ? responseData.data
            : responseData;

        if (updatedTask && typeof updatedTask === 'object' && 'id' in updatedTask) {
          setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? (updatedTask as DailyTask) : task))
          );
        } else {
          await loadTasks();
        }

        setSuccessModal({
          isOpen: true,
          message: action === "start" ? "Görev başarıyla başlatıldı! Kolay gelsin." : "Tebrikler! Görev başarıyla tamamlandı.",
        });
        
        setTimeout(() => {
          setSuccessModal({ isOpen: false, message: "" });
        }, 3000);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
      } finally {
        setActionLoading(null);
        setSelectedTaskId(null);
        setQrAction(null);
        isProcessingQr.current = false;
      }
    },
    [qrAction, selectedTaskId, loadTasks]
  );

  const handleFlag = useCallback(
    async (taskId: string) => {
      setActionLoading(taskId);
      setActionError("");

      try {
        const endpoint = `/tasks/${taskId}/flag`;
        const response = await apiRequest(endpoint, {
          method: "PATCH",
          body: { reason: "Manuel olarak işaretlendi" },
        });

        if (!response.success) {
          throw new Error("İşlem başarısız.");
        }

        const responseData = response.data as Record<string, unknown>;
        const updatedTask =
          responseData?.data && !Array.isArray(responseData.data)
            ? responseData.data
            : responseData;

        if (updatedTask && typeof updatedTask === 'object' && 'id' in updatedTask) {
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
    [loadTasks]
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

                <TabsList className="flex h-12 w-full items-center justify-start gap-2 overflow-x-auto rounded-full bg-slate-100 p-1 px-2 no-scrollbar dark:bg-slate-800 sm:w-auto">
                  <TabsTrigger className="min-w-fit rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm" value="all">Tümü ({stats.total})</TabsTrigger>
                  <TabsTrigger className="min-w-fit rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm" value="pending">Bekleyen ({stats.pending})</TabsTrigger>
                  <TabsTrigger className="min-w-fit rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm" value="progress">Devam Eden ({stats.inProgress})</TabsTrigger>
                  <TabsTrigger className="min-w-fit rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm" value="done">Tamamlanan ({stats.completed})</TabsTrigger>
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

      {/* SUCCESS DIALOG */}
      <Dialog open={successModal.isOpen} onOpenChange={(open) => setSuccessModal({ ...successModal, isOpen: open })}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 animate-bounce">
              <CheckCircle2 className="size-10 text-emerald-600" />
            </div>
            <DialogTitle className="text-2xl text-emerald-700">Başarılı!</DialogTitle>
            <DialogDescription className="text-base">
              {successModal.message}
            </DialogDescription>
            <Button className="mt-4 w-full max-w-[200px]" onClick={() => setSuccessModal({ isOpen: false, message: "" })}>
              Tamam
            </Button>
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

        const statusColorMap: Record<string, string> = {
          SCHEDULED: "border-slate-300",
          PENDING: "border-yellow-400",
          IN_PROGRESS: "border-blue-500",
          DONE: "border-emerald-500",
          MISSED: "border-red-500",
          FLAGGED: "border-orange-500",
        };
        const statusBorder = statusColorMap[task.status] || "border-slate-200";

        return (
          <Card 
            key={task.id} 
            className={cn(
              "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900/50",
              "border-l-[4px]",
              statusBorder
            )}
          >
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <MapPin className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{task.zoneName}</CardTitle>
                    <CardDescription className="text-[13px] font-medium text-slate-500">{task.zoneCode}</CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className={cn("w-fit shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold", config.className)}>
                  {config.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5 pt-0">
              <div className="flex flex-wrap gap-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/50">
                  <Clock3 className="size-3.5" />
                  {formatTime(task.scheduledFor)}
                </span>

                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/50">
                  <ClipboardList className="size-3.5" />
                  {task.checklistCount} kontrol
                </span>

                {task.completedAt && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    Bitti {formatTime(task.completedAt)}
                  </span>
                )}
              </div>

              {task.checklist && task.checklist.length > 0 && (
                <>
                  <div className="mt-2 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-900/50">
                    <div className="grid gap-2.5">
                      {task.checklist.slice(0, 3).map((item, index) => (
                        <div key={`${task.id}-${index}`} className="flex items-start gap-2.5 text-[13px] font-medium">
                          <div className="mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600" />
                          <span className="text-slate-700 dark:text-slate-300 leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                    {task.checklist.length > 3 && (
                      <p className="mt-2.5 pl-6 text-[11px] font-semibold text-primary">
                        + {task.checklist.length - 3} kontrol daha
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator className="my-2.5 opacity-50" />

              {/* ACTIONS */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
                {(task.status === "SCHEDULED" || task.status === "PENDING") && (
                  <Button
                    type="button"
                    size="default"
                    disabled={isLoading}
                    onClick={() => onStart(task.id)}
                    className="w-full gap-2 rounded-xl text-sm font-semibold shadow-sm sm:w-auto transition-transform active:scale-[0.98] py-5"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    Göreve Başla
                  </Button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <Button
                    type="button"
                    size="default"
                    disabled={isLoading}
                    onClick={() => onComplete(task.id)}
                    className="w-full gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto transition-transform active:scale-[0.98] py-5"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Görevi Tamamla
                  </Button>
                )}

                {task.status !== "DONE" &&
                  task.status !== "MISSED" &&
                  task.status !== "FLAGGED" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      disabled={isLoading}
                      onClick={() => onFlag(task.id)}
                      className="w-full gap-2 rounded-xl text-sm font-semibold sm:w-auto py-5"
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
                      Sorun Bildir
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