import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectServiceService } from './project-service.service';
import { CreateProjectDto } from '@app/common';

@Controller()
export class ProjectServiceController {
  constructor(private readonly projectService: ProjectServiceService) { }

  @MessagePattern({ cmd: 'create_project' })
  create(@Payload() data: { dto: CreateProjectDto; userId: string }) {
    return this.projectService.create(data.dto, data.userId);
  }

  @MessagePattern({ cmd: 'get_all_projects' })
  findAll() {
    return this.projectService.findAll();
  }

  @MessagePattern({ cmd: 'get_my_projects' })
  findByUser(@Payload() userId: string) {
    return this.projectService.findByUser(userId);
  }

  @MessagePattern({ cmd: 'get_project_by_id' })
  findOne(@Payload() id: string) {
    return this.projectService.findOne(id);
  }
}