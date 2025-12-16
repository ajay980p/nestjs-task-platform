import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskStatusDto } from '@app/common';

@Injectable()
export class TaskServiceService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) { }

  // Create a new task after validating project exists via project microservice
  async create(createTaskDto: CreateTaskDto) {
    try {
      const project = await lastValueFrom(
        this.projectClient.send({ cmd: 'get_project_by_id' }, createTaskDto.projectId)
      );

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const newTask = new this.taskModel({
        ...createTaskDto,
        projectId: new Types.ObjectId(createTaskDto.projectId),
        assignedTo: createTaskDto.assignedTo ? new Types.ObjectId(createTaskDto.assignedTo) : null,
      });

      return await newTask.save();
    } catch (error) {
      // Re-throw NotFoundException and RpcException as-is
      if (error instanceof NotFoundException || error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to create task',
      });
    }
  }

  // Get all tasks associated with a specific project ID
  async findByProject(projectId: string) {
    try {
      return await this.taskModel.find({ projectId: new Types.ObjectId(projectId) }).exec();
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch tasks',
      });
    }
  }

  // Update task status to TO_DO, IN_PROGRESS, or DONE and return updated task
  async updateStatus(taskId: string, updateTaskStatusDto: UpdateTaskStatusDto) {
    try {
      return await this.taskModel.findByIdAndUpdate(
        taskId,
        { status: updateTaskStatusDto.status },
        { new: true },
      ).exec();
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to update task status',
      });
    }
  }
}