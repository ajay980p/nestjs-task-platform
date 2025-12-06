import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { AuthGuard } from '../guards/auth.guard';
import { CreateProjectDto, UpdateProjectDto } from '@app/common';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(AuthGuard)
  @Post()
  createProject(@Body() body: { dto: CreateProjectDto }, @Req() req: any) {
    // userId token se automatically extract ho jayega
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.projectsService.createProject(body.dto, userId);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAllProjects(@Req() req: any) {
    // userId aur role token se automatically extract ho jayega
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }

    // Agar ADMIN hai to saare projects dikhao, warna sirf apne projects
    if (userRole === 'ADMIN') {
      return this.projectsService.findAllProjects(userId);
    } else {
      return this.projectsService.findMyProjects(userId);
    }
  }

  @UseGuards(AuthGuard)
  @Get('my')
  findMyProjects(@Req() req: any) {
    // userId token se automatically extract ho jayega
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.projectsService.findMyProjects(userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOneProject(@Param('id') id: string) {
    return this.projectsService.findOneProject(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateProject(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.projectsService.updateProject(id, updateProjectDto, userId);
  }
}

