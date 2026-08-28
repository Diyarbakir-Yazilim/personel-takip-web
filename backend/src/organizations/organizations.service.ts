import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { floors: true } },
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
      throw new NotFoundException(`Bina bulunamadı: ${id}`);
    }

    return building;
  }

  async updateBuilding(id: string, dto: Partial<CreateBuildingDto>) {
    try {
      return await this.prisma.building.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Bina bulunamadı: ${id}`);
      }
      throw error;
    }
  }

  async deleteBuilding(id: string) {
    try {
      return await this.prisma.building.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Bina bulunamadı: ${id}`);
        }
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Bu binaya bağlı katlar veya bölgeler var. Önce bağlı alt öğeleri silmelisiniz.',
          );
        }
      }
      throw error;
    }
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
      throw new NotFoundException(`Kat bulunamadı: ${id}`);
    }

    return floor;
  }

  async updateFloor(id: string, dto: Partial<CreateFloorDto>) {
    try {
      return await this.prisma.floor.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Kat bulunamadı: ${id}`);
      }
      throw error;
    }
  }

  async deleteFloor(id: string) {
    try {
      return await this.prisma.floor.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Kat bulunamadı: ${id}`);
        }
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Bu kata bağlı bölgeler var. Önce bağlı bölgeleri silmelisiniz.',
          );
        }
      }
      throw error;
    }
  }

  // ==========================================
  // ZONES
  // ==========================================

  async createZone(dto: CreateZoneDto) {
    if (dto.floorId) {
      await this.findOneFloor(dto.floorId);
    }

    try {
      return await this.prisma.zone.create({
        data: {
          code: dto.code,
          name: dto.name,
          floorId: dto.floorId ?? null,
          minDurationSec: dto.minDurationSec ?? null,
          maxDurationSec: dto.maxDurationSec ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Bu bölge kodu zaten kullanımda: ${dto.code}`,
        );
      }
      throw error;
    }
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
      throw new NotFoundException(`Bölge bulunamadı: ${id}`);
    }

    return zone;
  }

  async updateZone(id: string, dto: Partial<CreateZoneDto>) {
    try {
      return await this.prisma.zone.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Bölge bulunamadı: ${id}`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Bu bölge kodu zaten kullanımda: ${dto.code}`,
          );
        }
      }
      throw error;
    }
  }

  async deleteZone(id: string) {
    try {
      return await this.prisma.zone.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Bölge bulunamadı: ${id}`);
      }
      throw error;
    }
  }
}
