"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Progress } from "@/components/ui/progress";

import { Separator } from "@/components/ui/separator";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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

const statusConfig: Record<
  TaskStatus,
  {
    label: string;
    className: string;
  }
> = {
  SCHEDULED: {
    label: "Planlandı",
    className:
      "border-slate-200 bg-slate-50 text-slate-700",
  },

  PENDING: {
    label: "Bekliyor",
    className:
      "border-amber-200 bg-amber-50 text-amber-800",
  },

  IN_PROGRESS: {
    label: "Devam ediyor",
    className:
      "border-blue-200 bg-blue-50 text-blue-800",
  },

  DONE: {
    label: "Tamamlandı",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
  },

  MISSED: {
    label: "Gecikti",
    className:
      "border-red-200 bg-red-50 text-red-800",
  },

  FLAGGED: {
    label: "Kontrol gerekli",
    className:
      "border-orange-200 bg-orange-50 text-orange-800",
  },
};

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const localToken =
    window.localStorage.getItem("access_token") ||
    window.localStorage.getItem("token");

  if (localToken) {
    return localToken;
  }

  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return cookieToken
    ? decodeURIComponent(cookieToken)
    : null;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDateLabel() {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function StaffDailyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);

  // Start as false to avoid SSR/CSR mismatch on disabled prop.
  // Will be set to true immediately on the client inside useEffect.
  const [isLoading, setIsLoading] =
    useState(false);

  // Tracks whether the component has mounted on the client.
  // Used to safely render date strings that depend on new Date().
  const [mounted, setMounted] = useState(false);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  /*
   * QR sadece butona basıldığında açılacak.
   */
  const [qrOpen, setQrOpen] =
    useState(false);

  const [qrAction, setQrAction] =
    useState<QRAction | null>(null);

  const [selectedTaskId, setSelectedTaskId] =
    useState<string | null>(null);

  const apiBaseUrl = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_URL || "")
        .replace(/\/$/, ""),
    []
  );

  /*
   * ---------------------------------------
   * GÖREVLERİ GETİR
   * GET /tasks/my-day
   * ---------------------------------------
   */

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const token = getStoredToken();

    if (!token) {
      setTasks([]);
      setError(
        "Görevleri görmek için oturum açmanız gerekiyor."
      );
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = apiBaseUrl
        ? `${apiBaseUrl}/tasks/my-day`
        : "/api/tasks/my-day";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          "Görev listesi alınamadı."
        );
      }

      const data = await response.json();

      const taskList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.tasks)
            ? data.tasks
            : [];

      setTasks(taskList as DailyTask[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Beklenmeyen bir hata oluştu."
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  /*
   * ---------------------------------------
   * QR DIALOG AÇ
   * ---------------------------------------
   */

  const openQR = useCallback(
    (
      taskId: string,
      action: QRAction
    ) => {
      setActionError("");

      setSelectedTaskId(taskId);

      setQrAction(action);

      setQrOpen(true);
    },
    []
  );

  /*
   * ---------------------------------------
   * QR OKUNDU
   * ---------------------------------------
   *
   * QRScanner -> onScan
   *           ôô
   * handleQRScan
   *           ôô
   * PATCH /tasks/:id/start
   * veya
   * PATCH /tasks/:id/complete
   */

  const handleQRScan = useCallback(
    async (qrValue: string) => {
      if (!selectedTaskId || !qrAction) {
        return;
      }

      const token = getStoredToken();

      if (!token) {
        setActionError(
          "Oturum açmanız gerekiyor."
        );
        setQrOpen(false);
        return;
      }

      const taskId = selectedTaskId;
      const action = qrAction;

      setQrOpen(false);

      setActionLoading(taskId);
      setActionError("");

      try {
        const endpoint = apiBaseUrl
          ? `${apiBaseUrl}/tasks/${taskId}/${action}`
          : `/api/tasks/${taskId}/${action}`;

        const response = await fetch(
          endpoint,
          {
            method: "PATCH",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              qrCode: qrValue,
            }),
          }
        );

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => ({}));

          throw new Error(
            errorData.message ||
              `İşlem başarısız: ${response.statusText}`
          );
        }

        const responseData = await response.json();
        const updatedTask =
          responseData?.data && !Array.isArray(responseData.data)
            ? responseData.data
            : responseData;

        if (updatedTask?.id) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? (updatedTask as DailyTask)
                : task
            )
          );
        } else {
          await loadTasks();
        }
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Beklenmeyen bir hata oluştu."
        );
      } finally {
        setActionLoading(null);
        setSelectedTaskId(null);
        setQrAction(null);
      }
    },
    [
      apiBaseUrl,
      qrAction,
      selectedTaskId,
    ]
  );

  /*
   * ---------------------------------------
   * FLAG
   * PATCH /tasks/:id/flag
   * ---------------------------------------
   */

  const handleFlag = useCallback(
    async (taskId: string) => {
      const token = getStoredToken();

      if (!token) {
        setActionError(
          "Oturum açmanız gerekiyor."
        );
        return;
      }

      setActionLoading(taskId);
      setActionError("");

      try {
        const endpoint = apiBaseUrl
          ? `${apiBaseUrl}/tasks/${taskId}/flag`
          : `/api/tasks/${taskId}/flag`;

        const response = await fetch(
          endpoint,
          {
            method: "PATCH",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              reason:
                "Manuel olarak işaretlendi",
            }),
          }
        );

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => ({}));

          throw new Error(
            errorData.message ||
              `İşlem başarısız: ${response.statusText}`
          );
        }

        const responseData = await response.json();
        const updatedTask =
          responseData?.data && !Array.isArray(responseData.data)
            ? responseData.data
            : responseData;

        if (updatedTask?.id) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? (updatedTask as DailyTask)
                : task
            )
          );
        } else {
          await loadTasks();
        }
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Beklenmeyen bir hata oluştu."
        );
      } finally {
        setActionLoading(null);
      }
    },
    [apiBaseUrl]
  );

  useEffect(() => {
    // Mark as mounted so client-only renders (date, disabled) are safe.
    setMounted(true);
    void loadTasks();
  }, [loadTasks]);

  /*
   * ---------------------------------------
   * İSTATİSTİKLER
   * ---------------------------------------
   */

  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) =>
      task.status === "SCHEDULED" ||
      task.status === "PENDING"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) =>
      task.status === "IN_PROGRESS"
  ).length;

  const completedTasks = tasks.filter(
    (task) =>
      task.status === "DONE"
  ).length;

  const completionRate =
    totalTasks > 0
      ? Math.round(
          (completedTasks /
            totalTasks) *
            100
        )
      : 0;

  const visibleTasks = tasks;

  /*
   * ---------------------------------------
   * UI
   * ---------------------------------------
   */

  return (
    <section className="w-full space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>

            <span className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {mounted ? getDateLabel() : ""}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Bugünkü Görevler
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Atanan görevlerini takip edebilir,
            görevleri QR kod ile başlatıp
            tamamlayabilirsin.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void loadTasks()
          }
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCcw
            className={cn(
              "size-4",
              isLoading &&
                "animate-spin"
            )}
          />

          Yenile
        </Button>
      </div>

      {/* ERROR */}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />

          <AlertTitle>
            Görevler yüklenemedi
          </AlertTitle>

          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />

          <AlertTitle>
            İşlem gerçekleştirilemedi
          </AlertTitle>

          <AlertDescription>
            {actionError}
          </AlertDescription>
        </Alert>
      )}

      {/* LOADING */}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(
            (item) => (
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
            )
          )}
        </div>
      ) : (
        <>
          {/* STATS */}

          {!error && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Toplam
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {totalTasks}
                    </span>

                    <ClipboardList className="size-5 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Bekleyen
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {pendingTasks}
                    </span>

                    <Clock3 className="size-5 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Devam Eden
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {inProgressTasks}
                    </span>

                    <Timer className="size-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Tamamlanan
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {completedTasks}
                    </span>

                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PROGRESS */}

          {!error &&
            totalTasks > 0 && (
              <Card>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        Günlük ilerleme
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Tamamlanan görev oranı
                      </p>
                    </div>

                    <span className="font-bold">
                      %{completionRate}
                    </span>
                  </div>

                  <Progress
                    value={
                      completionRate
                    }
                  />
                </CardContent>
              </Card>
            )}

          {/* TABS */}

          {!error && (
            <Tabs
              defaultValue="all"
              className="w-full"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Görev Listesi
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Bugün sana atanan görevler
                  </p>
                </div>

                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all">
                    Tümü
                  </TabsTrigger>

                  <TabsTrigger value="pending">
                    Bekleyen
                  </TabsTrigger>

                  <TabsTrigger value="progress">
                    Devam Eden
                  </TabsTrigger>

                  <TabsTrigger value="done">
                    Tamamlanan
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="all"
                className="mt-4"
              >
                <TaskList
                  tasks={visibleTasks}
                  actionLoading={
                    actionLoading
                  }
                  onStart={(id) =>
                    openQR(
                      id,
                      "start"
                    )
                  }
                  onComplete={(id) =>
                    openQR(
                      id,
                      "complete"
                    )
                  }
                  onFlag={handleFlag}
                />
              </TabsContent>

              <TabsContent
                value="pending"
                className="mt-4"
              >
                <TaskList
                  tasks={tasks.filter(
                    (task) =>
                      task.status ===
                        "SCHEDULED" ||
                      task.status ===
                        "PENDING"
                  )}
                  actionLoading={
                    actionLoading
                  }
                  onStart={(id) =>
                    openQR(
                      id,
                      "start"
                    )
                  }
                  onComplete={(id) =>
                    openQR(
                      id,
                      "complete"
                    )
                  }
                  onFlag={handleFlag}
                />
              </TabsContent>

              <TabsContent
                value="progress"
                className="mt-4"
              >
                <TaskList
                  tasks={tasks.filter(
                    (task) =>
                      task.status ===
                      "IN_PROGRESS"
                  )}
                  actionLoading={
                    actionLoading
                  }
                  onStart={(id) =>
                    openQR(
                      id,
                      "start"
                    )
                  }
                  onComplete={(id) =>
                    openQR(
                      id,
                      "complete"
                    )
                  }
                  onFlag={handleFlag}
                />
              </TabsContent>

              <TabsContent
                value="done"
                className="mt-4"
              >
                <TaskList
                  tasks={tasks.filter(
                    (task) =>
                      task.status === "DONE"
                  )}
                  actionLoading={
                    actionLoading
                  }
                  onStart={(id) =>
                    openQR(
                      id,
                      "start"
                    )
                  }
                  onComplete={(id) =>
                    openQR(
                      id,
                      "complete"
                    )
                  }
                  onFlag={handleFlag}
                />
              </TabsContent>
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
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {qrAction === "start"
                ? "Görevi Başlat"
                : "Görevi Tamamla"}
            </DialogTitle>

            <DialogDescription>
              {qrAction === "start"
                ? "Göreve başlamak için görev alanındaki QR kodu okutun."
                : "Görevi tamamlamak için görev alanındaki QR kodu okutun."}
            </DialogDescription>
          </DialogHeader>

          <QRScanner
            onScan={handleQRScan}
            onError={(message) =>
              setActionError(
                `Kamera hatası: ${message}`
              )
            }
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| TASK LIST
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

          <h3 className="font-semibold">
            Bu kategoride Görev yok
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Şu anda gösterilecek görev bulunmuyor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => {
        const config =
          statusConfig[task.status];

        const isLoading =
          actionLoading === task.id;

        return (
          <Card
            key={task.id}
            className="overflow-hidden transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {task.zoneName}
                    </CardTitle>

                    <CardDescription>
                      {task.zoneCode}
                    </CardDescription>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "w-fit",
                    config.className
                  )}
                >
                  {config.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-4" />

                  {formatTime(
                    task.scheduledFor
                  )}
                </span>

                <span className="flex items-center gap-1.5">
                  <ClipboardList className="size-4" />

                  {task.checklistCount} kontrol
                </span>

                {task.completedAt && (
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="size-4" />

                    Tamamlandı{" "}
                    {formatTime(
                      task.completedAt
                    )}
                  </span>
                )}
              </div>

              {task.checklist.length > 0 && (
                <>
                  <Separator />

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Kontrol Listesi
                    </p>

                    <div className="grid gap-2">
                      {task.checklist
                        .slice(0, 4)
                        .map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={`${task.id}-${index}`}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />

                              <span>
                                {item}
                              </span>
                            </div>
                          )
                        )}
                    </div>

                    {task.checklist
                      .length > 4 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        +
                        {task.checklist
                          .length - 4}{" "}
                        kontrol daha
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* ACTIONS */}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {(task.status ===
                  "SCHEDULED" ||
                  task.status ===
                    "PENDING") && (
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      onStart(task.id)
                    }
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

                {task.status ===
                  "IN_PROGRESS" && (
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      onComplete(
                        task.id
                      )
                    }
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}

                    Görevi Tamamla
                  </Button>
                )}

                {task.status !==
                  "DONE" &&
                  task.status !==
                    "MISSED" &&
                  task.status !==
                    "FLAGGED" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() =>
                        onFlag(task.id)
                      }
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