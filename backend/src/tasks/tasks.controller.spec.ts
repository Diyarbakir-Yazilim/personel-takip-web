import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockUser = { userId: 'test-user-id' };
  const mockTask = {
    id: 'task-1',
    zoneCode: 'ZONE_A',
    zoneName: 'Zone A',
    status: 'SCHEDULED',
    scheduledFor: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    checklist: ['Check 1', 'Check 2'],
    checklistCount: 2,
  };

  const mockTasksService = {
    findMyDayTasks: jest.fn().mockResolvedValue([mockTask]),
    findOne: jest.fn().mockResolvedValue(mockTask),
    startTask: jest.fn().mockResolvedValue({
      ...mockTask,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
    }),
    completeTask: jest.fn().mockResolvedValue({
      ...mockTask,
      status: 'DONE',
      completedAt: new Date().toISOString(),
    }),
    flagTask: jest.fn().mockResolvedValue({
      ...mockTask,
      status: 'FLAGGED',
    }),
    updateTask: jest.fn().mockResolvedValue(mockTask),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyDay', () => {
    it('should return tasks for the current day', async () => {
      const result = await controller.getMyDay({ user: mockUser });
      expect(result).toEqual([mockTask]);
      expect(service.findMyDayTasks).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const result = await controller.findOne('task-1', { user: mockUser });
      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith('task-1', mockUser.userId);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTasksService.findOne.mockRejectedValueOnce(
        new NotFoundException('Gorev bulunamadi')
      );
      await expect(
        controller.findOne('invalid-id', { user: mockUser })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startTask', () => {
    it('should start a task', async () => {
      const result = await controller.startTask('task-1', { user: mockUser });
      expect(result.status).toBe('IN_PROGRESS');
      expect(service.startTask).toHaveBeenCalledWith('task-1', mockUser.userId);
    });
  });

  describe('completeTask', () => {
    it('should complete a task', async () => {
      const result = await controller.completeTask('task-1', { user: mockUser });
      expect(result.status).toBe('DONE');
      expect(service.completeTask).toHaveBeenCalledWith('task-1', mockUser.userId, undefined);
    });
  });

  describe('flagTask', () => {
    it('should flag a task', async () => {
      const result = await controller.flagTask('task-1', { user: mockUser }, { reason: 'Test reason' });
      expect(result.status).toBe('FLAGGED');
      expect(service.flagTask).toHaveBeenCalledWith('task-1', mockUser.userId, 'Test reason');
    });

    it('should throw BadRequestException when reason is missing', async () => {
      expect(() => controller.flagTask('task-1', { user: mockUser }, {})).toThrow(
        BadRequestException
      );
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const updateData = { status: 'PENDING' };
      const result = await controller.updateTask('task-1', { user: mockUser }, updateData);
      expect(result).toEqual(mockTask);
      expect(service.updateTask).toHaveBeenCalledWith('task-1', mockUser.userId, updateData);
    });
  });
});
