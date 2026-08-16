import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TaskSchedulerService implements OnModuleInit {
  constructor(@InjectQueue('task-generator-queue') private taskQueue: Queue) {}

  async onModuleInit() {
    // BullMQ v5+ Job Scheduler API'si ile gece yarısı çalışan cron job tanımlama
    await this.taskQueue.upsertJobScheduler(
      'nightly-task-generator',
      {
        pattern: '0 0 * * *', // Her gün gece yarısı 00:00
      },
      {
        name: 'generate-daily-tasks',
        data: {},
      },
    );
    console.log('🌙 Nightly Task Generator cron job scheduled successfully.');
  }
}