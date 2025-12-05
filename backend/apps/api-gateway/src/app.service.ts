import { Inject, Injectable, UnauthorizedException, ConflictException, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
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
    return firstValueFrom(
      this.authClient.send({ cmd: 'register' }, createUserDto).pipe(
        catchError((error) => {
          // Handle RpcException format
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Registration failed';

          if (statusCode === 409) {
            throw new ConflictException(message);
          }
          throw new HttpException(message, statusCode);
        })
      )
    );
  }

  // 2. Login Request Forward karna
  async login(loginUserDto: LoginUserDto) {
    return firstValueFrom(
      this.authClient.send({ cmd: 'login' }, loginUserDto).pipe(
        catchError((error) => {
          // Handle RpcException format
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Login failed';

          if (statusCode === 401) {
            throw new UnauthorizedException(message);
          }
          throw new HttpException(message, statusCode);
        })
      )
    );
  }

  // 3. Get User Profile
  async getProfile(userId: string) {
    return firstValueFrom(
      this.authClient.send({ cmd: 'get_profile' }, userId).pipe(
        catchError((error) => {
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Failed to get profile';
          throw new HttpException(message, statusCode);
        })
      )
    );
  }

  // 4. Get All Users
  async getAllUsers() {
    return firstValueFrom(
      this.authClient.send({ cmd: 'get_all_users' }, {}).pipe(
        catchError((error) => {
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Failed to get users';
          throw new HttpException(message, statusCode);
        })
      )
    );
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