import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateTaskDto, UpdateTaskStatusDto } from '@app/common';

@Injectable()
export class TasksService {
  constructor(
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
  ) {}

  createTask(createTaskDto: CreateTaskDto) {
    return this.taskClient.send({ cmd: 'create_task' }, createTaskDto);
  }

  findTasksByProject(projectId: string) {
    return this.taskClient.send({ cmd: 'get_tasks_by_project' }, projectId);
  }

  updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto) {
    return this.taskClient.send({ cmd: 'update_task_status' }, { taskId, dto });
  }
}

