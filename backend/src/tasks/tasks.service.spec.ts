import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockTask = {
    id: 'task-1',
    zoneId: 'zone-1',
    userId: 'user-1',
    status: 'SCHEDULED',
    scheduledFor: new Date(),
    startedAt: null,
    completedAt: null,
    checklist: ['Check 1', 'Check 2'],
    zone: {
      code: 'ZONE_A',
      name: 'Zone A',
    },
  };

  const mockPrismaService = {
    taskInstance: {
      findMany: jest.fn().mockResolvedValue([mockTask]),
      findUnique: jest.fn().mockResolvedValue(mockTask),
      update: jest.fn().mockResolvedValue(mockTask),
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


  describe('findMyDayTasks', () => {
    it('should return tasks for the current day', async () => {
      const result = await service.findMyDayTasks('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
      expect(prisma.taskInstance.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const result = await service.findOne('task-1', 'user-1');
      expect(result.id).toBe('task-1');
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.taskInstance.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when user does not own the task', async () => {
      await expect(service.findOne('task-1', 'other-user')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('startTask', () => {
    it('should start a task', async () => {
      mockPrismaService.taskInstance.update.mockResolvedValueOnce({
        ...mockTask,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });

      const result = await service.startTask('task-1', 'user-1');
      expect(result.status).toBe('IN_PROGRESS');
      expect(prisma.taskInstance.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException when task is already in progress', async () => {
      mockPrismaService.taskInstance.findUnique.mockResolvedValueOnce({
        ...mockTask,
        status: 'IN_PROGRESS',
      });

      await expect(service.startTask('task-1', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('completeTask', () => {
    it('should complete a task', async () => {
      mockPrismaService.taskInstance.findUnique.mockResolvedValueOnce({
        ...mockTask,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });

      mockPrismaService.taskInstance.update.mockResolvedValueOnce({
        ...mockTask,
        status: 'DONE',
        completedAt: new Date(),
      });

      const result = await service.completeTask('task-1', 'user-1');
      expect(result.status).toBe('DONE');
    });

    it('should throw BadRequestException when task is not in progress', async () => {
      await expect(service.completeTask('task-1', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('flagTask', () => {
    it('should flag a task', async () => {
      mockPrismaService.taskInstance.update.mockResolvedValueOnce({
        ...mockTask,
        status: 'FLAGGED',
      });

      const result = await service.flagTask('task-1', 'user-1', 'Test reason');
      expect(result.status).toBe('FLAGGED');
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const updateData = { status: 'PENDING' };
      const result = await service.updateTask('task-1', 'user-1', updateData);
      expect(result.id).toBe('task-1');
      expect(prisma.taskInstance.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: updateData,
        include: expect.any(Object),
      });
    });
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
