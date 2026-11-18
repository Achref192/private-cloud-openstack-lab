import { IsString, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { TaskStatus, TaskPriority } from '../task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsEnum(TaskPriority)
  priority: TaskPriority;
}
