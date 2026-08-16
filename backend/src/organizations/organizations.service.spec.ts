import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const mockBuilding = {
    id: 'building-1',
    name: 'Ana Bina',
    createdAt: new Date(),
    updatedAt: new Date(),
    floors: [],
  };

  const mockFloor = {
    id: 'floor-1',
    buildingId: 'building-1',
    name: '1. Kat',
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    zones: [],
  };

  const mockZone = {
    id: 'zone-1',
    floorId: 'floor-1',
    code: 'ZONE_A',
    name: 'Bölge A',
    minDurationSec: null,
    maxDurationSec: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    floor: { id: 'floor-1', name: '1. Kat', level: 1 },
  };

  const mockPrisma = {
    building: {
      create: jest.fn().mockResolvedValue(mockBuilding),
      findMany: jest.fn().mockResolvedValue([mockBuilding]),
      findUnique: jest.fn().mockResolvedValue(mockBuilding),
      update: jest.fn().mockResolvedValue(mockBuilding),
      delete: jest.fn().mockResolvedValue(mockBuilding),
    },
    floor: {
      create: jest.fn().mockResolvedValue(mockFloor),
      findMany: jest.fn().mockResolvedValue([mockFloor]),
      findUnique: jest.fn().mockResolvedValue(mockFloor),
      update: jest.fn().mockResolvedValue(mockFloor),
      delete: jest.fn().mockResolvedValue(mockFloor),
    },
    zone: {
      create: jest.fn().mockResolvedValue(mockZone),
      findMany: jest.fn().mockResolvedValue([mockZone]),
      findUnique: jest.fn().mockResolvedValue(mockZone),
      update: jest.fn().mockResolvedValue(mockZone),
      delete: jest.fn().mockResolvedValue(mockZone),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // BUILDINGS
  // ==========================================

  describe('createBuilding', () => {
    it('should create and return a building', async () => {
      const result = await service.createBuilding({ name: 'Ana Bina' });
      expect(result).toEqual(mockBuilding);
      expect(mockPrisma.building.create).toHaveBeenCalledWith({
        data: { name: 'Ana Bina' },
      });
    });
  });

  describe('findAllBuildings', () => {
    it('should return all buildings with floors and zones', async () => {
      const result = await service.findAllBuildings();
      expect(result).toEqual([mockBuilding]);
      expect(mockPrisma.building.findMany).toHaveBeenCalled();
    });
  });

  describe('findOneBuilding', () => {
    it('should return a building by id', async () => {
      const result = await service.findOneBuilding('building-1');
      expect(result).toEqual(mockBuilding);
    });

    it('should throw NotFoundException when building does not exist', async () => {
      mockPrisma.building.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOneBuilding('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateBuilding', () => {
    it('should update and return a building', async () => {
      const updated = { ...mockBuilding, name: 'Yeni Bina Adı' };
      mockPrisma.building.update.mockResolvedValueOnce(updated);

      const result = await service.updateBuilding('building-1', { name: 'Yeni Bina Adı' });
      expect(result.name).toBe('Yeni Bina Adı');
    });

    it('should throw NotFoundException when building does not exist', async () => {
      mockPrisma.building.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.updateBuilding('non-existent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBuilding', () => {
    it('should delete a building', async () => {
      const result = await service.deleteBuilding('building-1');
      expect(result).toEqual(mockBuilding);
      expect(mockPrisma.building.delete).toHaveBeenCalledWith({
        where: { id: 'building-1' },
      });
    });

    it('should throw NotFoundException when building does not exist', async () => {
      mockPrisma.building.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteBuilding('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==========================================
  // FLOORS
  // ==========================================

  describe('createFloor', () => {
    it('should create and return a floor', async () => {
      const result = await service.createFloor({
        buildingId: 'building-1',
        name: '1. Kat',
        level: 1,
      });
      expect(result).toEqual(mockFloor);
      expect(mockPrisma.floor.create).toHaveBeenCalledWith({
        data: { buildingId: 'building-1', name: '1. Kat', level: 1 },
      });
    });

    it('should throw NotFoundException when building does not exist', async () => {
      mockPrisma.building.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.createFloor({ buildingId: 'non-existent', name: 'Kat' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a floor without a building (standalone)', async () => {
      const result = await service.createFloor({ name: 'Bodrum Kat', level: -1 });
      expect(mockPrisma.building.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockFloor);
    });
  });

  describe('findAllFloors', () => {
    it('should return all floors', async () => {
      const result = await service.findAllFloors();
      expect(result).toEqual([mockFloor]);
    });

    it('should filter floors by buildingId', async () => {
      await service.findAllFloors('building-1');
      expect(mockPrisma.floor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { buildingId: 'building-1' } }),
      );
    });
  });

  describe('findOneFloor', () => {
    it('should return a floor by id', async () => {
      const result = await service.findOneFloor('floor-1');
      expect(result).toEqual(mockFloor);
    });

    it('should throw NotFoundException when floor does not exist', async () => {
      mockPrisma.floor.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOneFloor('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateFloor', () => {
    it('should update and return a floor', async () => {
      const updated = { ...mockFloor, name: '2. Kat' };
      mockPrisma.floor.update.mockResolvedValueOnce(updated);

      const result = await service.updateFloor('floor-1', { name: '2. Kat' });
      expect(result.name).toBe('2. Kat');
    });
  });

  describe('deleteFloor', () => {
    it('should delete a floor', async () => {
      const result = await service.deleteFloor('floor-1');
      expect(result).toEqual(mockFloor);
      expect(mockPrisma.floor.delete).toHaveBeenCalledWith({
        where: { id: 'floor-1' },
      });
    });
  });

  // ==========================================
  // ZONES
  // ==========================================

  describe('createZone', () => {
    it('should create and return a zone', async () => {
      mockPrisma.zone.findUnique.mockResolvedValueOnce(null); // code unique kontrolü

      const result = await service.createZone({
        floorId: 'floor-1',
        code: 'ZONE_A',
        name: 'Bölge A',
      });
      expect(result).toEqual(mockZone);
    });

    it('should throw ConflictException when zone code already exists', async () => {
      // findOne(floor) → bulundu; findUnique(code) → mevcut
      mockPrisma.zone.findUnique.mockResolvedValueOnce(mockZone);

      await expect(
        service.createZone({ code: 'ZONE_A', name: 'Başka Bölge' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when floor does not exist', async () => {
      mockPrisma.floor.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createZone({ floorId: 'non-existent', code: 'ZONE_B', name: 'B' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllZones', () => {
    it('should return all zones', async () => {
      const result = await service.findAllZones();
      expect(result).toEqual([mockZone]);
    });

    it('should filter zones by floorId', async () => {
      await service.findAllZones('floor-1');
      expect(mockPrisma.zone.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { floorId: 'floor-1' } }),
      );
    });
  });

  describe('findOneZone', () => {
    it('should return a zone by id', async () => {
      const result = await service.findOneZone('zone-1');
      expect(result).toEqual(mockZone);
    });

    it('should throw NotFoundException when zone does not exist', async () => {
      mockPrisma.zone.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOneZone('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateZone', () => {
    it('should update and return a zone', async () => {
      const updated = { ...mockZone, name: 'Yeni Bölge' };
      mockPrisma.zone.update.mockResolvedValueOnce(updated);

      const result = await service.updateZone('zone-1', { name: 'Yeni Bölge' });
      expect(result.name).toBe('Yeni Bölge');
    });

    it('should throw ConflictException when updating to an existing code', async () => {
      const otherZone = { ...mockZone, id: 'zone-999' };
      // findOneZone → mevcut; findUnique(code) → başka bir zone
      mockPrisma.zone.findUnique
        .mockResolvedValueOnce(mockZone)   // findOneZone check
        .mockResolvedValueOnce(otherZone); // code uniqueness check

      await expect(
        service.updateZone('zone-1', { code: 'ZONE_TAKEN' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteZone', () => {
    it('should delete a zone', async () => {
      const result = await service.deleteZone('zone-1');
      expect(result).toEqual(mockZone);
      expect(mockPrisma.zone.delete).toHaveBeenCalledWith({
        where: { id: 'zone-1' },
      });
    });

    it('should throw NotFoundException when zone does not exist', async () => {
      mockPrisma.zone.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteZone('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
