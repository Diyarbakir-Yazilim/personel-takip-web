import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsEnum(TaskStatus, {
    message: 'status must be a valid TaskStatus enum value',
  })
  status: TaskStatus;
}
