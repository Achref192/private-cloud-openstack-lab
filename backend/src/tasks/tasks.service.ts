import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = new this.taskModel(createTaskDto);
    return task.save();
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async getStats() {
    const tasks = await this.taskModel.find().exec();
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === TaskStatus.TODO).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const done = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      byStatus: {
        todo,
        in_progress: inProgress,
        done,
      },
      completionRate,
    };
  }
}
