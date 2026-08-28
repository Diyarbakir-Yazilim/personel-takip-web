import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Formats raw task database entity into a standardized response payload.
   */
  private formatTaskResponse(task: any) {
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

    const tasks = await this.prisma.taskInstance.findMany({
      where: {
        scheduledFor: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let flaggedTasks = 0;
    let missedTasks = 0;

    for (const task of tasks) {
      if (task.status === TaskStatus.DONE) completedTasks++;
      else if (
        task.status === TaskStatus.SCHEDULED ||
        task.status === TaskStatus.PENDING
      )
        pendingTasks++;
      else if (task.status === TaskStatus.IN_PROGRESS) inProgressTasks++;
      else if (task.status === TaskStatus.FLAGGED) flaggedTasks++;
      else if (task.status === TaskStatus.MISSED) missedTasks++;
    }

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      flaggedTasks,
      missedTasks,
      completionRate,
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

    if (task.userId !== userId) {
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
