import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import { CreateUserDto, LoginUserDto } from '../../../libs/common/src/dto/create-user.dto';

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) { }

  @MessagePattern({ cmd: 'register' }) // Gateway yahi command bhejega
  register(@Payload() data: CreateUserDto) {
    return this.authService.register(data);
  }

  @MessagePattern({ cmd: 'login' })
  login(@Payload() data: LoginUserDto) {
    return this.authService.login(data);
  }

  @MessagePattern({ cmd: 'validate_user' })
  validateUser(@Payload() userId: string) {
    return this.authService.validateUser(userId);
  }
}