import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskServiceService } from './task-service.service';
import { CreateTaskDto, UpdateTaskStatusDto } from '@app/common';

@Controller()
export class TaskServiceController {
  constructor(private readonly taskService: TaskServiceService) { }

  @MessagePattern({ cmd: 'create_task' })
  create(@Payload() data: CreateTaskDto) {
    return this.taskService.create(data);
  }

  @MessagePattern({ cmd: 'get_tasks_by_project' })
  findByProject(@Payload() projectId: string) {
    return this.taskService.findByProject(projectId);
  }

  @MessagePattern({ cmd: 'update_task_status' })
  updateStatus(@Payload() data: { taskId: string; dto: UpdateTaskStatusDto }) {
    return this.taskService.updateStatus(data.taskId, data.dto);
  }
}