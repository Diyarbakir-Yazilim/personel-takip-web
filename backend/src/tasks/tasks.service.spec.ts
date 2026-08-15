import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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
});
