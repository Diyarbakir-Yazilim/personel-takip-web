import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockPrismaService = {
    taskInstance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateTaskStatus', () => {
    const taskId = 'test-uuid-123';

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.taskInstance.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return task directly if status is unchanged', async () => {
      const existingTask = { id: taskId, status: TaskStatus.SCHEDULED };
      mockPrismaService.taskInstance.findUnique.mockResolvedValue(existingTask);

      const result = await service.updateTaskStatus(taskId, TaskStatus.SCHEDULED);

      expect(result).toEqual(existingTask);
      expect(mockPrismaService.taskInstance.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if current status is DONE or MISSED', async () => {
      const doneTask = { id: taskId, status: TaskStatus.DONE };
      mockPrismaService.taskInstance.findUnique.mockResolvedValue(doneTask);

      await expect(
        service.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when moving to DONE directly without IN_PROGRESS', async () => {
      const scheduledTask = { id: taskId, status: TaskStatus.SCHEDULED };
      mockPrismaService.taskInstance.findUnique.mockResolvedValue(scheduledTask);

      await expect(
        service.updateTaskStatus(taskId, TaskStatus.DONE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should start task and record startedAt timestamp when status changes to IN_PROGRESS', async () => {
      const scheduledTask = { id: taskId, status: TaskStatus.SCHEDULED };
      mockPrismaService.taskInstance.findUnique.mockResolvedValue(scheduledTask);
      mockPrismaService.taskInstance.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...scheduledTask, ...data }),
      );

      const result = await service.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(mockPrismaService.taskInstance.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: expect.objectContaining({
          status: TaskStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
        }),
      });
    });

    it('should complete task, record completedAt and calculate durationSec accurately when status changes to DONE', async () => {
      // 100 saniye önce başlamış bir görev simüle ediyoruz
      const startTime = new Date(Date.now() - 100 * 1000);
      const inProgressTask = {
        id: taskId,
        status: TaskStatus.IN_PROGRESS,
        startedAt: startTime,
      };

      mockPrismaService.taskInstance.findUnique.mockResolvedValue(inProgressTask);
      mockPrismaService.taskInstance.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...inProgressTask, ...data }),
      );

      const result = await service.updateTaskStatus(taskId, TaskStatus.DONE);

      expect(result.status).toBe(TaskStatus.DONE);
      expect(result.completedAt).toBeInstanceOf(Date);
      // 100 saniye civarında bir süre hesaplanmalı
      expect(result.durationSec).toBeGreaterThanOrEqual(99);
      expect(result.durationSec).toBeLessThanOrEqual(101);

      expect(mockPrismaService.taskInstance.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: expect.objectContaining({
          status: TaskStatus.DONE,
          completedAt: expect.any(Date),
          durationSec: expect.any(Number),
        }),
      });
    });
  });
});