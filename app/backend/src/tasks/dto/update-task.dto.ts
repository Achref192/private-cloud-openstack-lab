import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { TaskStatus, TaskPriority } from '../task.schema';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
