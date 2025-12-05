import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
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

  @MessagePattern({ cmd: 'verify_token' })
  async verifyToken(@Payload() data: { token: string }) {
    const decoded = await this.authService.verifyToken(data.token);
    // Return user details
    const user = await this.authService.validateUser(decoded.userId);
    return {
      userId: user?._id?.toString() || '',
      email: user?.email || '',
      name: user?.name || '',
      role: user?.role || '',
    };
  }

  @MessagePattern({ cmd: 'get_profile' })
  async getProfile(@Payload() userId: string) {
    console.log('getProfile', userId);
    return this.authService.validateUser(userId);
  }
}