import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ProjectServiceService } from './project-service.service';
import { CreateProjectDto, UpdateProjectDto } from '@app/common';

@Controller()
export class ProjectServiceController {
  constructor(private readonly projectService: ProjectServiceService) { }

  // Create a new project with title, description, and assigned users
  @MessagePattern({ cmd: 'create_project' })
  async create(@Payload() data: { dto: CreateProjectDto; userId: string }) {
    try {
      return await this.projectService.create(data.dto, data.userId);
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to create project',
      });
    }
  }

  // Get all projects in the system (typically used by Admin)
  @MessagePattern({ cmd: 'get_all_projects' })
  async findAll() {
    try {
      return await this.projectService.findAll();
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch all projects',
      });
    }
  }

  // Get all projects assigned to a specific user
  @MessagePattern({ cmd: 'get_my_projects' })
  async findByUser(@Payload() userId: string) {
    try {
      return await this.projectService.findByUser(userId);
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch user projects',
      });
    }
  }

  // Get a single project by its ID
  @MessagePattern({ cmd: 'get_project_by_id' })
  async findOne(@Payload() id: string) {
    try {
      return await this.projectService.findOne(id);
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch project',
      });
    }
  }

  // Update an existing project's details (title, description, assigned users)
  @MessagePattern({ cmd: 'update_project' })
  async update(@Payload() data: { id: string; dto: UpdateProjectDto }) {
    try {
      console.log('update_project message received:', data);
      const result = await this.projectService.update(data.id, data.dto);
      return result;
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to update project',
      });
    }
  }
}