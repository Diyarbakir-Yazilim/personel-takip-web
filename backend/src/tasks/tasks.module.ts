import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskSchedulerService } from './task-scheduler.service';
import { TasksProcessor } from './tasks.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'task-generator-queue',
    }),
    PrismaModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskSchedulerService, TasksProcessor],
  exports: [TasksService],
})
export class TasksModule {}
