import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateUserDto, CreateProjectDto, CreateTaskDto, UpdateTaskStatusDto, LoginUserDto } from '@app/common';

@Injectable()
export class AppService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
  ) { }

  // 1. Register Request Forward karna
  async createUser(createUserDto: CreateUserDto) {
    return firstValueFrom(this.authClient.send({ cmd: 'register' }, createUserDto));
  }

  // 2. Login Request Forward karna
  async login(loginUserDto: LoginUserDto) {
    return firstValueFrom(this.authClient.send({ cmd: 'login' }, loginUserDto));
  }


  // --- PROJECTS ---
  createProject(createProjectDto: CreateProjectDto, userId: string) {
    return this.projectClient.send({ cmd: 'create_project' }, { dto: createProjectDto, userId });
  }

  findAllProjects() {
    return this.projectClient.send({ cmd: 'get_all_projects' }, {});
  }

  findMyProjects(userId: string) {
    return this.projectClient.send({ cmd: 'get_my_projects' }, userId);
  }

  findOneProject(id: string) {
    return this.projectClient.send({ cmd: 'get_project_by_id' }, id);
  }



  // --- TASKS (New Methods) ---
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