import { Body, Controller, Get, Post, Param, Query, Patch } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto, CreateTaskDto, UpdateTaskStatusDto, LoginUserDto, CreateProjectDto } from '@app/common';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.appService.createUser(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.appService.login(loginUserDto);
  }


  @Post('projects')
  createProject(@Body() body: { dto: CreateProjectDto; userId: string }) {
    return this.appService.createProject(body.dto, body.userId);
  }

  // 2. Get All Projects (Admin)
  @Get('projects')
  findAllProjects() {
    return this.appService.findAllProjects();
  }

  // 3. Get My Projects (User)
  @Get('projects/my')
  findMyProjects(@Query('userId') userId: string) {
    return this.appService.findMyProjects(userId);
  }

  // 4. Get Single Project
  @Get('projects/:id')
  findOneProject(@Param('id') id: string) {
    return this.appService.findOneProject(id);
  }



  // --- TASKS (New Routes) ---

  @Post('tasks')
  createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.appService.createTask(createTaskDto);
  }

  @Get('projects/:projectId/tasks')
  findTasksByProject(@Param('projectId') projectId: string) {
    return this.appService.findTasksByProject(projectId);
  }

  @Patch('tasks/:id/status')
  updateTaskStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.appService.updateTaskStatus(id, dto);
  }
}