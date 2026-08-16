import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Processor('task-generator-queue')
@Injectable()
export class TasksProcessor extends WorkerHost {
  private readonly logger = new Logger(TasksProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[Nightly Job] Running task generation job: ${job.id}`);

    try {
      // Şemada TaskTemplate olmadığı için sistemdeki tüm Zone'ları alıp her biri için task oluşturabiliriz
      const zones = await this.prisma.zone.findMany();

      this.logger.log(`[Nightly Job] Found ${zones.length} zones to generate task instances.`);

      const now = new Date();
      let createdCount = 0;

      for (const zone of zones) {
        try {
          await this.prisma.taskInstance.create({
            data: {
              zoneId: zone.id,
              status: 'SCHEDULED',
              scheduledFor: now,
              checklist: [], // Gerekirse varsayılan maddeler eklenebilir
            },
          });
          createdCount++;
        } catch (zoneError) {
          this.logger.error(`Failed to generate task instance for zone ${zone.id}: ${zoneError.message}`);
        }
      }

      this.logger.log(`[Nightly Job] Successfully generated ${createdCount} TaskInstances.`);
      return { success: true, createdCount, generatedAt: now };
    } catch (error) {
      this.logger.error(`[Nightly Job] Failed to generate tasks: ${error.message}`, error.stack);
      throw error;
    }
  }
}