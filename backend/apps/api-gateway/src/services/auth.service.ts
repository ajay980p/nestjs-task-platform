import { Inject, Injectable, UnauthorizedException, ConflictException, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { CreateUserDto, LoginUserDto } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  // Register Request Forward karna
  async createUser(createUserDto: CreateUserDto) {
    return firstValueFrom(
      this.authClient.send({ cmd: 'register' }, createUserDto).pipe(
        catchError((error) => {
          // Handle RpcException format
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Registration failed';

          if (statusCode === 409) {
            throw new ConflictException(message);
          }
          throw new HttpException(message, statusCode);
        })
      )
    );
  }

  // Login Request Forward karna
  async login(loginUserDto: LoginUserDto) {
    return firstValueFrom(
      this.authClient.send({ cmd: 'login' }, loginUserDto).pipe(
        catchError((error) => {
          // Handle RpcException format
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Login failed';

          if (statusCode === 401) {
            throw new UnauthorizedException(message);
          }
          throw new HttpException(message, statusCode);
        })
      )
    );
  }

  // Get User Profile
  async getProfile(userId: string) {
    return firstValueFrom(
      this.authClient.send({ cmd: 'get_profile' }, userId).pipe(
        catchError((error) => {
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Failed to get profile';
          throw new HttpException(message, statusCode);
        })
      )
    );
  }

  // Get All Users
  async getAllUsers() {
    return firstValueFrom(
      this.authClient.send({ cmd: 'get_all_users' }, {}).pipe(
        catchError((error) => {
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Failed to get users';
          throw new HttpException(message, statusCode);
        })
      )
    );
  }
}

