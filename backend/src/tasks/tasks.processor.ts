import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import  parseExpression  from 'cron-parser';

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
      const templates = await (this.prisma as any).taskTemplate.findMany({
        where: { isActive: true },
      });

      this.logger.log(`[Nightly Job] Found ${templates.length} active task templates.`);

      const now = new Date();
      let createdCount = 0;

      for (const template of templates) {
        try {
          const interval = parseExpression.parse(template.cronExpression);
          
          await (this.prisma as any).taskInstance.create({
            data: {
              template: {
                connect: { id: template.id },
              },
              title: template.title,
              description: template.description,
              status: 'SCHEDULED',
              scheduledDate: now,
            },
          });
          createdCount++;
        } catch (cronError) {
          this.logger.error(`Invalid cron expression for template ${template.id}: ${template.cronExpression}`);
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