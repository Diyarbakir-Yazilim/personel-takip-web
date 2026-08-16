import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { CreateZoneDto } from './dto/create-zone.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ==========================================
  // BUILDINGS
  // ==========================================

  @Post('buildings')
  @Roles(UserRole.ADMIN)
  createBuilding(@Body() dto: CreateBuildingDto) {
    return this.organizationsService.createBuilding(dto);
  }

  @Get('buildings')
  findAllBuildings() {
    return this.organizationsService.findAllBuildings();
  }

  @Get('buildings/:id')
  findOneBuilding(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOneBuilding(id);
  }

  @Patch('buildings/:id')
  @Roles(UserRole.ADMIN)
  updateBuilding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateBuildingDto>,
  ) {
    return this.organizationsService.updateBuilding(id, dto);
  }

  @Delete('buildings/:id')
  @Roles(UserRole.ADMIN)
  deleteBuilding(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.deleteBuilding(id);
  }

  // ==========================================
  // FLOORS
  // ==========================================

  @Post('floors')
  @Roles(UserRole.ADMIN)
  createFloor(@Body() dto: CreateFloorDto) {
    return this.organizationsService.createFloor(dto);
  }

  @Get('floors')
  findAllFloors(@Query('buildingId') buildingId?: string) {
    return this.organizationsService.findAllFloors(buildingId);
  }

  @Get('floors/:id')
  findOneFloor(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOneFloor(id);
  }

  @Patch('floors/:id')
  @Roles(UserRole.ADMIN)
  updateFloor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateFloorDto>,
  ) {
    return this.organizationsService.updateFloor(id, dto);
  }

  @Delete('floors/:id')
  @Roles(UserRole.ADMIN)
  deleteFloor(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.deleteFloor(id);
  }

  // ==========================================
  // ZONES
  // ==========================================

  @Post('zones')
  @Roles(UserRole.ADMIN)
  createZone(@Body() dto: CreateZoneDto) {
    return this.organizationsService.createZone(dto);
  }

  @Get('zones')
  findAllZones(@Query('floorId') floorId?: string) {
    return this.organizationsService.findAllZones(floorId);
  }

  @Get('zones/:id')
  findOneZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOneZone(id);
  }

  @Patch('zones/:id')
  @Roles(UserRole.ADMIN)
  updateZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateZoneDto>,
  ) {
    return this.organizationsService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  @Roles(UserRole.ADMIN)
  deleteZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.deleteZone(id);
  }
}
