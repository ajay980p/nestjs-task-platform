import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProjectDto, UpdateProjectDto } from '@app/common';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}

  createProject(createProjectDto: CreateProjectDto, userId: string) {
    return this.projectClient.send({ cmd: 'create_project' }, { dto: createProjectDto, userId });
  }

  findAllProjects(userId: string) {
    return this.projectClient.send({ cmd: 'get_all_projects' }, { userId });
  }

  findMyProjects(userId: string) {
    return this.projectClient.send({ cmd: 'get_my_projects' }, userId);
  }

  findOneProject(id: string) {
    return this.projectClient.send({ cmd: 'get_project_by_id' }, id);
  }

  updateProject(id: string, updateProjectDto: UpdateProjectDto, userId?: string) {
    return this.projectClient.send({ cmd: 'update_project' }, { id, dto: updateProjectDto, userId });
  }
}

