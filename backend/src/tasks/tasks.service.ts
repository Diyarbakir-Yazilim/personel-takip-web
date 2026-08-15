import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    // 1. Return early if status is already unchanged
    if (task.status === newStatus) {
      return task;
    }

    // 2. STATE MACHINE (Transition Rules)
    // Completed (DONE) or Missed (MISSED) tasks are locked from updates
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.MISSED) {
      throw new BadRequestException(`Tasks with status '${task.status}' cannot be updated.`);
    }

    // Prevent direct completion from SCHEDULED or PENDING status without starting first
    if (newStatus === TaskStatus.DONE && task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Task must be marked as IN_PROGRESS before it can be completed.');
    }

    // 3. SERVER TIMESTAMPS & DURATION CALCULATION
    const now = new Date(); // Pure server-side timestamp for anti-tamper security
    const updateData: Record<string, any> = { status: newStatus };

    // IN_PROGRESS transition -> Record start time
    if (newStatus === TaskStatus.IN_PROGRESS) {
      updateData.startedAt = now;
    }

    // DONE transition -> Record completion time and calculate durationSec
    if (newStatus === TaskStatus.DONE) {
      updateData.completedAt = now;

      // Fallback to current time if start time is missing
      const startTime = task.startedAt ? task.startedAt.getTime() : now.getTime();
      const endTime = now.getTime();

      // Safe duration calculation in seconds
      updateData.durationSec = Math.max(0, Math.floor((endTime - startTime) / 1000));
    }

    return this.prisma.taskInstance.update({
      where: { id: taskId },
      data: updateData,
    });
  }
}