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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TasksService } from './tasks.service';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskStatus } from '@prisma/client';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email?: string;
    role?: string;
  };
}

@ApiTags('Task Management')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('dashboard-stats')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Retrieves dashboard statistics for admin and supervisors',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  getDashboardStats() {
    return this.tasksService.getDashboardStats();
  }

  @Get('my-day')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieves tasks assigned to the authenticated user for today',
  })
  @ApiResponse({
    status: 200,
    description: 'User tasks retrieved successfully.',
  })
  getMyDay(@Request() req: AuthenticatedRequest) {
    return this.tasksService.findMyDayTasks(req.user.userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves task details by UUID' })
  @ApiResponse({
    status: 200,
    description: 'Task details retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Patch(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Starts a specific cleaning task' })
  @ApiResponse({ status: 200, description: 'Task successfully started.' })
  startTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() body?: { qrCode?: string },
  ) {
    return this.tasksService.startTask(id, req.user.userId, body?.qrCode);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marks a specific cleaning task as completed' })
  @ApiResponse({ status: 200, description: 'Task successfully completed.' })
  completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body()
    body?: { notes?: string; checklistItems?: number[]; qrCode?: string },
  ) {
    return this.tasksService.completeTask(
      id,
      req.user.userId,
      body,
      body?.qrCode,
    );
  }

  @Patch(':id/flag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flags a task with a specific reason/issue' })
  @ApiResponse({ status: 200, description: 'Task successfully flagged.' })
  @ApiResponse({ status: 400, description: 'Reason is missing.' })
  flagTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() body?: { reason?: string },
  ) {
    if (!body?.reason) {
      throw new BadRequestException('Reason must be provided to flag a task.');
    }
    return this.tasksService.flagTask(id, req.user.userId, body.reason);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Updates task details' })
  @ApiResponse({ status: 200, description: 'Task successfully updated.' })
  updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateData?: { status?: TaskStatus; checklist?: string[] },
  ) {
    return this.tasksService.updateTask(id, req.user.userId, updateData ?? {});
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Directly updates the status of a task',
  })
  @ApiResponse({
    status: 200,
    description: 'Task status successfully updated.',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateTaskStatus(id, dto.status);
  }
}
