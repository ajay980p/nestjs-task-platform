import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto, LoginUserDto, CreateProjectDto } from '@app/common';

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
}