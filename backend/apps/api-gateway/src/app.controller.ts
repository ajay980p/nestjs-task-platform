import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto, LoginUserDto } from '../../../libs/common/src/dto/create-user.dto';

@Controller('auth') // Saare URL /auth se start honge
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('register') // POST http://localhost:3000/auth/register
  register(@Body() createUserDto: CreateUserDto) {
    return this.appService.createUser(createUserDto);
  }

  @Post('login') // POST http://localhost:3000/auth/login
  login(@Body() loginUserDto: LoginUserDto) {
    return this.appService.login(loginUserDto);
  }
}