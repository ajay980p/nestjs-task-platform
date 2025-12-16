import { Inject, Injectable, UnauthorizedException, ConflictException, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import type { Response } from 'express';
import { CreateUserDto, LoginUserDto } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) { }

  async createUser(createUserDto: CreateUserDto) {
    return firstValueFrom(
      this.authClient.send({ cmd: 'register' }, createUserDto).pipe(
        catchError((error) => {
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

  async login(loginUserDto: LoginUserDto, res: Response) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'login' }, loginUserDto).pipe(
        catchError((error) => {
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

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'Login successful',
      user: result.user,
    };
  }

  // Logout - Clear cookie
  logout(res: Response) {
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  // Get User Profile with formatted response
  async getProfile(userId: string) {
    const user = await firstValueFrom(
      this.authClient.send({ cmd: 'get_profile' }, userId).pipe(
        catchError((error) => {
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Failed to get profile';
          throw new HttpException(message, statusCode);
        })
      )
    );

    // Format response
    return {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  // Get All Users with formatted response
  async getAllUsers() {
    const users = await firstValueFrom(
      this.authClient.send({ cmd: 'get_all_users' }, {}).pipe(
        catchError((error) => {
          const errorObj = error.error || error;
          const statusCode = errorObj?.status || error.status || 500;
          const message = errorObj?.message || error.message || 'Failed to get users';
          throw new HttpException(message, statusCode);
        })
      )
    );

    // Format response
    return users.map((user: any) => ({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }
}