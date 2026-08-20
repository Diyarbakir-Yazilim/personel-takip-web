import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  Param,
  Request,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TasksService } from './tasks.service';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskStatus } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('dashboard-stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  getDashboardStats() {
    return this.tasksService.getDashboardStats();
  }

  @Get('my-day')
  getMyDay(@Request() req: any) {
    return this.tasksService.findMyDayTasks(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Patch(':id/start')
  startTask(@Param('id') id: string, @Request() req: any, @Body() body?: { qrCode?: string }) {
    return this.tasksService.startTask(id, req.user.userId, body?.qrCode);
  }

  @Patch(':id/complete')
  completeTask(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { notes?: string; checklistItems?: number[], qrCode?: string }
  ) {
    return this.tasksService.completeTask(id, req.user.userId, body, body?.qrCode);
  }

  @Patch(':id/flag')
  flagTask(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { reason?: string }
  ) {
    if (!body?.reason) {
      throw new BadRequestException('Sebep belirtilmeli');
    }
    return this.tasksService.flagTask(id, req.user.userId, body.reason);
  }

  @Put(':id')
  updateTask(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateData?: { status?: TaskStatus; checklist?: string[] }
  ) {
    return this.tasksService.updateTask(id, req.user.userId, updateData ?? {});
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateTaskStatus(id, dto.status);
  }
}
