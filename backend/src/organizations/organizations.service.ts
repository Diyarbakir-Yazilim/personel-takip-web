import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { CreateZoneDto } from './dto/create-zone.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // BUILDINGS
  // ==========================================

  async createBuilding(dto: CreateBuildingDto) {
    return this.prisma.building.create({
      data: { name: dto.name },
    });
  }

  async findAllBuildings() {
    return this.prisma.building.findMany({
      include: {
        floors: {
          include: {
            zones: true,
          },
          orderBy: { level: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneBuilding(id: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        floors: {
          include: {
            zones: true,
          },
          orderBy: { level: 'asc' },
        },
      },
    });

    if (!building) {
      throw new NotFoundException(`Bina bulunamadi: ${id}`);
    }

    return building;
  }

  async updateBuilding(id: string, dto: Partial<CreateBuildingDto>) {
    await this.findOneBuilding(id);
    return this.prisma.building.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBuilding(id: string) {
    await this.findOneBuilding(id);
    return this.prisma.building.delete({ where: { id } });
  }

  // ==========================================
  // FLOORS
  // ==========================================

  async createFloor(dto: CreateFloorDto) {
    if (dto.buildingId) {
      await this.findOneBuilding(dto.buildingId);
    }

    return this.prisma.floor.create({
      data: {
        name: dto.name,
        level: dto.level ?? 0,
        buildingId: dto.buildingId ?? null,
      },
    });
  }

  async findAllFloors(buildingId?: string) {
    return this.prisma.floor.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: {
        zones: true,
      },
      orderBy: { level: 'asc' },
    });
  }

  async findOneFloor(id: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id },
      include: { zones: true },
    });

    if (!floor) {
      throw new NotFoundException(`Kat bulunamadi: ${id}`);
    }

    return floor;
  }

  async updateFloor(id: string, dto: Partial<CreateFloorDto>) {
    await this.findOneFloor(id);
    return this.prisma.floor.update({
      where: { id },
      data: dto,
    });
  }

  async deleteFloor(id: string) {
    await this.findOneFloor(id);
    return this.prisma.floor.delete({ where: { id } });
  }

  // ==========================================
  // ZONES
  // ==========================================

  async createZone(dto: CreateZoneDto) {
    if (dto.floorId) {
      await this.findOneFloor(dto.floorId);
    }

    const existing = await this.prisma.zone.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Bu kod zaten kullanimda: ${dto.code}`);
    }

    return this.prisma.zone.create({
      data: {
        code: dto.code,
        name: dto.name,
        floorId: dto.floorId ?? null,
        minDurationSec: dto.minDurationSec ?? null,
        maxDurationSec: dto.maxDurationSec ?? null,
      },
    });
  }

  async findAllZones(floorId?: string) {
    return this.prisma.zone.findMany({
      where: floorId ? { floorId } : undefined,
      include: {
        floor: {
          select: { id: true, name: true, level: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneZone(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        floor: {
          select: { id: true, name: true, level: true },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Bolge bulunamadi: ${id}`);
    }

    return zone;
  }

  async updateZone(id: string, dto: Partial<CreateZoneDto>) {
    await this.findOneZone(id);

    // code güncelleniyorsa unique kontrolü yap
    if (dto.code) {
      const existing = await this.prisma.zone.findUnique({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Bu kod zaten kullanimda: ${dto.code}`);
      }
    }

    return this.prisma.zone.update({
      where: { id },
      data: dto,
    });
  }

  async deleteZone(id: string) {
    await this.findOneZone(id);
    return this.prisma.zone.delete({ where: { id } });
  }
}
