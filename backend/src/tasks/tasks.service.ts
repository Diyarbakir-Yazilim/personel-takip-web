import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, UserRole, ScanMethod } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Formats raw task database entity into a standardized response payload.
   */
  private formatTaskResponse(task: {
    id: string;
    status: TaskStatus;
    scheduledFor: Date;
    startedAt?: Date | null;
    completedAt?: Date | null;
    checklist?: unknown;
    zone?: {
      code?: string;
      name?: string;
    } | null;
  }) {
    return {
      id: task.id,
      zoneCode: task.zone?.code,
      zoneName: task.zone?.name,
      status: task.status,
      scheduledFor: task.scheduledFor,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      checklist: task.checklist,
      checklistCount: Array.isArray(task.checklist) ? task.checklist.length : 0,
    };
  }

  async getDashboardStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const allStaff = await this.prisma.user.findMany({
      where: { role: UserRole.STAFF },
      select: { id: true, fullName: true },
    });
    const totalStaff = allStaff.length;

    const activeStaffScans = await this.prisma.scanEvent.findMany({
      where: {
        clientScannedAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
        method: {
          in: [ScanMethod.DYNAMIC_QR, ScanMethod.STATIC_QR],
        },
        user: {
          role: UserRole.STAFF,
        },
      },
      include: {
        user: { select: { id: true, fullName: true } },
        task: {
          include: {
            zone: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { clientScannedAt: 'desc' },
    });

    const activeMap = new Map<
      string,
      { id: string; fullName: string; zoneName?: string; scannedAt: string }
    >();

    for (const scan of activeStaffScans) {
      if (!activeMap.has(scan.userId)) {
        const timeStr = scan.clientScannedAt
          ? new Date(scan.clientScannedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : '';
        activeMap.set(scan.userId, {
          id: scan.userId,
          fullName: scan.user.fullName,
          zoneName: scan.task?.zone?.name,
          scannedAt: timeStr,
        });
      }
    }

    const activeStaffList = Array.from(activeMap.values());
    const activeStaffIds = new Set(activeMap.keys());
    const activeStaff = activeStaffList.length;

    const inactiveStaffList = allStaff
      .filter((staff) => !activeStaffIds.has(staff.id))
      .map((staff) => ({
        id: staff.id,
        fullName: staff.fullName,
      }));

    // Bina sayısını kontrol ediyoruz (Tek bina mı yoksa birden fazla mı?)
    const totalBuildings = await this.prisma.building.count();
    const isSingleBuilding = totalBuildings <= 1;

    // Tüm kayıtlı yerleri (Zone) ve o günkü görev durumlarını alıyoruz
    const zones = await this.prisma.zone.findMany({
      include: {
        floor: {
          include: {
            building: true,
          },
        },
        tasks: {
          where: {
            scheduledFor: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        },
      },
    });

    const totalTasks = zones.length;
    let completedTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let flaggedTasks = 0;
    let missedTasks = 0;

    const breakdownMap = new Map<
      string,
      {
        buildingName: string;
        floorName: string;
        total: number;
        completed: number;
        completedZonesList: {
          id: string;
          zoneName: string;
          zoneCode?: string;
          status: string;
          buildingName: string;
          floorName: string;
        }[];
        inProgressZonesList: {
          id: string;
          zoneName: string;
          zoneCode?: string;
          status: string;
          buildingName: string;
          floorName: string;
        }[];
        pendingZonesList: {
          id: string;
          zoneName: string;
          zoneCode?: string;
          status: string;
          buildingName: string;
          floorName: string;
        }[];
        remainingZonesList: {
          id: string;
          zoneName: string;
          zoneCode?: string;
          status: string;
          buildingName: string;
          floorName: string;
        }[];
      }
    >();

    for (const zone of zones) {
      const todayTask = zone.tasks[0];
      const status = todayTask ? todayTask.status : TaskStatus.PENDING;

      if (status === TaskStatus.DONE) completedTasks++;
      else if (status === TaskStatus.SCHEDULED || status === TaskStatus.PENDING)
        pendingTasks++;
      else if (status === TaskStatus.IN_PROGRESS) inProgressTasks++;
      else if (status === TaskStatus.FLAGGED) flaggedTasks++;
      else if (status === TaskStatus.MISSED) missedTasks++;

      const buildingName = zone.floor?.building?.name || 'Genel Bina';
      const floorName = zone.floor?.name || 'Kat Bilgisi Yok';

      // Tek binaysa anahtar olarak sadece kat adını kullanıyoruz, birden fazlaysa bina + kat
      const key = isSingleBuilding ? floorName : `${buildingName}_${floorName}`;

      if (!breakdownMap.has(key)) {
        breakdownMap.set(key, {
          buildingName: isSingleBuilding ? '' : buildingName,
          floorName,
          total: 0,
          completed: 0,
          completedZonesList: [],
          inProgressZonesList: [],
          pendingZonesList: [],
          remainingZonesList: [],
        });
      }

      const row = breakdownMap.get(key)!;
      row.total++;

      const zoneInfo = {
        id: todayTask ? todayTask.id : zone.id,
        zoneName: zone.name || 'Bölge Adı Yok',
        zoneCode: zone.code,
        status: status,
        buildingName,
        floorName,
      };

      if (status === TaskStatus.DONE) {
        row.completed++;
        row.completedZonesList.push(zoneInfo);
      } else if (status === TaskStatus.IN_PROGRESS) {
        row.inProgressZonesList.push(zoneInfo);
      } else {
        row.pendingZonesList.push(zoneInfo);
        row.remainingZonesList.push(zoneInfo);
      }
    }

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const floorBreakdown = Array.from(breakdownMap.values());
    const recentActivity = await this.prisma.scanEvent.findMany({
      take: 10,
      orderBy: { clientScannedAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
        task: {
          include: {
            zone: { select: { name: true, code: true } },
          },
        },
      },
    });

    return {
      activeStaff,
      totalStaff,
      activeStaffList,
      inactiveStaffList,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      flaggedTasks,
      missedTasks,
      completionRate,
      isSingleBuilding,
      floorBreakdown,
      recentActivity,
    };
  }

  async findMyDayTasks(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const tasks = await this.prisma.taskInstance.findMany({
      where: {
        userId,
        scheduledFor: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        zone: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    return tasks.map((task) => this.formatTaskResponse(task));
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
      include: {
        zone: {
          select: {
            code: true,
            name: true,
          },
        },
        scans: {
          select: {
            id: true,
            createdAt: true,
            resolvedAction: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === UserRole.STAFF && task.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to access this task',
      );
    }

    return this.formatTaskResponse(task);
  }

  async startTask(id: string, userId: string, qrCode?: string) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to access this task',
      );
    }

    if (
      task.status !== TaskStatus.SCHEDULED &&
      task.status !== TaskStatus.PENDING
    ) {
      throw new BadRequestException(
        'This task has already been started or completed',
      );
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        zone: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (qrCode) {
      await this.prisma.scanEvent.create({
        data: {
          idempotencyKey: randomUUID(),
          clientEventId: randomUUID(),
          userId,
          taskId: id,
          token: qrCode,
          requestedAction: 'CHECK_IN',
          resolvedAction: 'CHECK_IN',
          method: 'DYNAMIC_QR',
          clientScannedAt: new Date(),
        },
      });
    }

    return this.formatTaskResponse(updated);
  }

  async completeTask(
    id: string,
    userId: string,
    completionData?: { notes?: string; checklistItems?: number[] },
    qrCode?: string,
  ) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to access this task',
      );
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Only tasks in progress can be completed');
    }

    const now = new Date();
    const startTime = task.startedAt ? task.startedAt.getTime() : now.getTime();
    const durationSec = Math.max(
      0,
      Math.floor((now.getTime() - startTime) / 1000),
    );

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        status: TaskStatus.DONE,
        completedAt: now,
        durationSec,
      },
      include: {
        zone: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (qrCode) {
      await this.prisma.scanEvent.create({
        data: {
          idempotencyKey: randomUUID(),
          clientEventId: randomUUID(),
          userId,
          taskId: id,
          token: qrCode,
          requestedAction: 'CHECK_OUT',
          resolvedAction: 'CHECK_OUT',
          method: 'DYNAMIC_QR',
          clientScannedAt: new Date(),
        },
      });
    }

    return this.formatTaskResponse(updated);
  }

  async flagTask(id: string, userId: string, reason: string) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to access this task',
      );
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        status: TaskStatus.FLAGGED,
      },
      include: {
        zone: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return this.formatTaskResponse(updated);
  }

  async updateTask(
    id: string,
    userId: string,
    updateData: {
      status?: TaskStatus;
      checklist?: string[];
    },
  ) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to access this task',
      );
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        ...(updateData?.status && { status: updateData.status }),
        ...(updateData?.checklist && { checklist: updateData.checklist }),
      },
      include: {
        zone: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return this.formatTaskResponse(updated);
  }

  async updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    if (task.status === newStatus) {
      return task;
    }

    if (task.status === TaskStatus.DONE || task.status === TaskStatus.MISSED) {
      throw new BadRequestException(
        `Tasks with status '${task.status}' cannot be updated.`,
      );
    }

    if (
      newStatus === TaskStatus.DONE &&
      task.status !== TaskStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Task must be marked as IN_PROGRESS before it can be completed.',
      );
    }

    const now = new Date();
    const updateData: {
      status: TaskStatus;
      startedAt?: Date;
      completedAt?: Date;
      durationSec?: number;
    } = { status: newStatus };

    if (newStatus === TaskStatus.IN_PROGRESS) {
      updateData.startedAt = now;
    }

    if (newStatus === TaskStatus.DONE) {
      updateData.completedAt = now;

      const startTime = task.startedAt
        ? task.startedAt.getTime()
        : now.getTime();
      const endTime = now.getTime();

      updateData.durationSec = Math.max(
        0,
        Math.floor((endTime - startTime) / 1000),
      );
    }

    return this.prisma.taskInstance.update({
      where: { id: taskId },
      data: updateData,
    });
  }
}
