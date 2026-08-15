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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('my-day')
  getMyDay(@Request() req) {
    return this.tasksService.findMyDayTasks(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Patch(':id/start')
  startTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.startTask(id, req.user.userId);
  }

  @Patch(':id/complete')
  completeTask(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { notes?: string; checklistItems?: number[] }
  ) {
    return this.tasksService.completeTask(id, req.user.userId, body);
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
    @Body() updateData?: { status?: string; checklist?: string[] }
  ) {
    return this.tasksService.updateTask(id, req.user.userId, updateData);
  }
}
