import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Processor('task-generator-queue')
@Injectable()
export class TasksProcessor extends WorkerHost {
  private readonly logger = new Logger(TasksProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Processes nightly background jobs to generate daily task instances for all active zones.
   */
  async process(
    job: Job<unknown, unknown, string>,
  ): Promise<{ success: boolean; createdCount: number; generatedAt: Date }> {
    this.logger.log(`[Nightly Job] Running task generation job ID: ${job.id}`);

    try {
      const zones = await this.prisma.zone.findMany({
        select: { id: true },
      });

      this.logger.log(
        `[Nightly Job] Found ${zones.length} zones to generate task instances.`,
      );

      const now = new Date();

      if (zones.length === 0) {
        return { success: true, createdCount: 0, generatedAt: now };
      }

      // Prepare payload for bulk creation
      const taskInstancesData = zones.map((zone) => ({
        zoneId: zone.id,
        status: TaskStatus.SCHEDULED,
        scheduledFor: now,
        checklist: [],
      }));

      // Perform bulk insert for optimal database performance
      const result = await this.prisma.taskInstance.createMany({
        data: taskInstancesData,
        skipDuplicates: true,
      });

      this.logger.log(
        `[Nightly Job] Successfully generated ${result.count} TaskInstances via bulk insert.`,
      );

      return {
        success: true,
        createdCount: result.count,
        generatedAt: now,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `[Nightly Job] Failed to generate tasks: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
