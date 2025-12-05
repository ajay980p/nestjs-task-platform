import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { AuthGuard } from './guards/auth.guard';
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
  async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.appService.login(loginUserDto);

    // Set token in HTTP-only cookie (1 day expiry)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Return response WITHOUT accessToken (token is in cookie)
    const response = {
      message: 'Login successful',
      user: result.user,
    };

    // Ensure accessToken is not in response
    if ('accessToken' in response) {
      delete (response as any).accessToken;
    }

    return response;
  }

  @UseGuards(AuthGuard)
  @Get('auth/me')
  async getProfile(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    const user = await this.appService.getProfile(userId);
    return {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  @UseGuards(AuthGuard)
  @Get('auth/users')
  async getAllUsers() {
    const users = await this.appService.getAllUsers();
    return users.map((user: any) => ({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  // --- PROJECT ROUTES (Ye ab seedha /projects pe chalenge) ---
  @UseGuards(AuthGuard)
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