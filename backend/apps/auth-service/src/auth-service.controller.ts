import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import { CreateUserDto, LoginUserDto } from '@app/common';

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) { }

  // Register a new user in the system
  @MessagePattern({ cmd: 'register' })
  register(@Payload() data: CreateUserDto) {
    return this.authService.register(data);
  }

  // Authenticate user and return access token with user details
  @MessagePattern({ cmd: 'login' })
  login(@Payload() data: LoginUserDto) {
    return this.authService.login(data);
  }

  // Validate and return user details by user ID
  @MessagePattern({ cmd: 'validate_user' })
  validateUser(@Payload() userId: string) {
    return this.authService.validateUser(userId);
  }

  // Verify JWT token and return user details (userId, email, name, role)
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

  // Get user profile by user ID
  @MessagePattern({ cmd: 'get_profile' })
  async getProfile(@Payload() userId: string) {
    return this.authService.validateUser(userId);
  }

  // Get all users with USER role (excluding ADMIN users)
  @MessagePattern({ cmd: 'get_all_users' })
  async getAllUsers(@Payload() data?: any) {
    try {
      const users = await this.authService.getAllUsers();
      return users;
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch users',
      });
    }
  }
}