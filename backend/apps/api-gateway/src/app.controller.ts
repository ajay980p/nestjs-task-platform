import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto, LoginUserDto, CreateProjectDto, CreateTaskDto, UpdateTaskStatusDto } from '@app/common';

@Controller() // 👈 CHANGE: Yahan se 'auth' hata diya hai. Ab ye Global Controller hai.
export class AppController {
  constructor(private readonly appService: AppService) { }

  // --- AUTH ROUTES (Yahan manually 'auth/' lagaya hai) ---

  @Post('auth/register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.appService.createUser(createUserDto);
  }

  @Post('auth/login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.appService.login(loginUserDto);
  }

  // --- PROJECT ROUTES (Ye ab seedha /projects pe chalenge) ---
  @Post('projects')
  createProject(@Body() body: { dto: CreateProjectDto; userId: string }) {
    return this.appService.createProject(body.dto, body.userId);
  }

  @Get('projects')
  findAllProjects() {
    return this.appService.findAllProjects();
  }

  @Get('projects/my')
  findMyProjects(@Query('userId') userId: string) {
    return this.appService.findMyProjects(userId);
  }

  @Get('projects/:id')
  findOneProject(@Param('id') id: string) {
    return this.appService.findOneProject(id);
  }

  // --- TASK ROUTES (Ye ab seedha /tasks pe chalenge) ---
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