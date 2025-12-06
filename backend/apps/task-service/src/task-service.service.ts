import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { lastValueFrom } from 'rxjs'; // 👈 Promise convert karne ke liye
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
    // Step A: Validate Project Exists (Microservice Call)
    // Hum Project Service ko bol rahe hain: "Bhai check kar ye ID sahi hai?"
    const project = await lastValueFrom(
      this.projectClient.send({ cmd: 'get_project_by_id' }, createTaskDto.projectId)
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Step B: Create Task
    const newTask = new this.taskModel({
      ...createTaskDto,
      projectId: new Types.ObjectId(createTaskDto.projectId),
      assignedTo: createTaskDto.assignedTo ? new Types.ObjectId(createTaskDto.assignedTo) : null,
    });

    return newTask.save();
  }

  // Get all tasks associated with a specific project ID
  async findByProject(projectId: string) {
    return this.taskModel.find({ projectId: new Types.ObjectId(projectId) }).exec();
  }

  // Update task status to TO_DO, IN_PROGRESS, or DONE and return updated task
  async updateStatus(taskId: string, updateTaskStatusDto: UpdateTaskStatusDto) {
    return this.taskModel.findByIdAndUpdate(
      taskId,
      { status: updateTaskStatusDto.status },
      { new: true },
    );
  }
}