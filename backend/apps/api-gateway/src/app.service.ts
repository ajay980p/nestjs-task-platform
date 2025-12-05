import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto, CreateProjectDto, LoginUserDto } from '@app/common';

@Injectable()
export class AppService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) { }

  // 1. Register Request Forward karna
  createUser(createUserDto: CreateUserDto) {
    return this.authClient.send({ cmd: 'register' }, createUserDto);
  }

  // 2. Login Request Forward karna
  login(loginUserDto: LoginUserDto) {
    return this.authClient.send({ cmd: 'login' }, loginUserDto);
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
}