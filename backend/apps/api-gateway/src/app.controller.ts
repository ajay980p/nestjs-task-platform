import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { AuthGuard } from './guards/auth.guard';
import { CreateUserDto, LoginUserDto, CreateProjectDto, CreateTaskDto, UpdateTaskStatusDto, UpdateProjectDto } from '@app/common';

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

  @Post('auth/logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the accessToken cookie
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    return { message: 'Logged out successfully' };
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
  createProject(@Body() body: { dto: CreateProjectDto }, @Req() req: any) {
    // userId token se automatically extract ho jayega
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.appService.createProject(body.dto, userId);
  }

  @UseGuards(AuthGuard)
  @Get('projects')
  async findAllProjects(@Req() req: any) {
    // userId aur role token se automatically extract ho jayega
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }

    // Agar ADMIN hai to saare projects dikhao, warna sirf apne projects
    if (userRole === 'ADMIN') {
      return this.appService.findAllProjects(userId);
    } else {
      return this.appService.findMyProjects(userId);
    }
  }

  @UseGuards(AuthGuard)
  @Get('projects/my')
  findMyProjects(@Req() req: any) {
    // userId token se automatically extract ho jayega
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.appService.findMyProjects(userId);
  }

  @UseGuards(AuthGuard)
  @Get('projects/:id')
  findOneProject(@Param('id') id: string) {
    return this.appService.findOneProject(id);
  }

  @UseGuards(AuthGuard)
  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.appService.updateProject(id, updateProjectDto, userId);
  }

  // --- TASK ROUTES (Ye ab seedha /tasks pe chalenge) ---
  @UseGuards(AuthGuard)
  @Post('tasks')
  createTask(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    // userId token se automatically extract ho jayega (if needed in future)
    const userId = req.user?.userId || req.user?.id;
    // Currently createTaskDto me already userId ho sakta hai, but token se verify kar sakte hain
    return this.appService.createTask(createTaskDto);
  }

  @UseGuards(AuthGuard)
  @Get('projects/:projectId/tasks')
  findTasksByProject(@Param('projectId') projectId: string) {
    return this.appService.findTasksByProject(projectId);
  }

  @UseGuards(AuthGuard)
  @Patch('tasks/:id/status')
  updateTaskStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.appService.updateTaskStatus(id, dto);
  }
}