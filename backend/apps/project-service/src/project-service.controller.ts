import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectServiceService } from './project-service.service';
import { CreateProjectDto, UpdateProjectDto } from '@app/common';

@Controller()
export class ProjectServiceController {
  constructor(private readonly projectService: ProjectServiceService) { }

  // Create a new project with title, description, and assigned users
  @MessagePattern({ cmd: 'create_project' })
  async create(@Payload() data: { dto: CreateProjectDto; userId: string }) {
    return await this.projectService.create(data.dto, data.userId);
  }

  // Get all projects created by a specific user (typically used by Admin to see their own projects)
  @MessagePattern({ cmd: 'get_all_projects' })
  async findAll(@Payload() data: { userId: string }) {
    return await this.projectService.findAll(data.userId);
  }

  // Get all projects assigned to a specific user
  @MessagePattern({ cmd: 'get_my_projects' })
  async findByUser(@Payload() userId: string) {
    return await this.projectService.findByUser(userId);
  }

  // Get a single project by its ID
  @MessagePattern({ cmd: 'get_project_by_id' })
  async findOne(@Payload() id: string) {
    return await this.projectService.findOne(id);
  }

  // Update an existing project's details (title, description, assigned users)
  @MessagePattern({ cmd: 'update_project' })
  async update(@Payload() data: { id: string; dto: UpdateProjectDto; userId?: string }) {
    return await this.projectService.update(data.id, data.dto, data.userId);
  }
}