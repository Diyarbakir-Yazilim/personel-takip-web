import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}


  private formatTaskResponse(task: any) {

    return {
      id: task.id,
      zoneCode: task.zone.code,
      zoneName: task.zone.name,
      status: task.status,
      scheduledFor: task.scheduledFor,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      checklist: task.checklist,
      checklistCount: task.checklist.length,
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
      throw new NotFoundException('Gorev bulunamadi');
    }

    if (task.userId !== userId) {
      throw new BadRequestException('Bu goreve erisme izniniz yok');
    }

    return this.formatTaskResponse(task);
  }

  async startTask(id: string, userId: string) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Gorev bulunamadi');
    }

    if (task.userId !== userId) {
      throw new BadRequestException('Bu goreve erisme izniniz yok');
    }

    if (task.status !== 'SCHEDULED' && task.status !== 'PENDING') {
      throw new BadRequestException('Bu gorev baslatilmis veya sonlanmis');
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
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

    return this.formatTaskResponse(updated);
  }

  async completeTask(
    id: string,
    userId: string,
    completionData?: { notes?: string; checklistItems?: number[] }
  ) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Gorev bulunamadi');
    }

    if (task.userId !== userId) {
      throw new BadRequestException('Bu goreve erisme izniniz yok');
    }

    if (task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Sadece baslamis gorevler tamamlanabilir');
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        status: 'DONE',
        completedAt: new Date(),
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

  async flagTask(id: string, userId: string, reason: string) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Gorev bulunamadi');
    }

    if (task.userId !== userId) {
      throw new BadRequestException('Bu goreve erisme izniniz yok');
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        status: 'FLAGGED',
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
    }
  ) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Gorev bulunamadi');
    }

    if (task.userId !== userId) {
      throw new BadRequestException('Bu goreve erisme izniniz yok');
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id },
      data: {
        ...(updateData?.status && { status: updateData.status as TaskStatus }),
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
      throw new BadRequestException(`Tasks with status '${task.status}' cannot be updated.`);
    }

    if (newStatus === TaskStatus.DONE && task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Task must be marked as IN_PROGRESS before it can be completed.');
    }

    const now = new Date();
    const updateData: Record<string, any> = { status: newStatus };

    if (newStatus === TaskStatus.IN_PROGRESS) {
      updateData.startedAt = now;
    }

    if (newStatus === TaskStatus.DONE) {
      updateData.completedAt = now;

      const startTime = task.startedAt ? task.startedAt.getTime() : now.getTime();
      const endTime = now.getTime();

      updateData.durationSec = Math.max(0, Math.floor((endTime - startTime) / 1000));
    }

    return this.prisma.taskInstance.update({
      where: { id: taskId },
      data: updateData,
    });
  }
}