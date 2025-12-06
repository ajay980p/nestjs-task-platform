import { Body, Controller, Get, Post, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';
import { CreateUserDto, LoginUserDto } from '@app/common';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() createUserDto: CreateUserDto) {
        return this.authService.createUser(createUserDto);
    }

    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(loginUserDto);

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

    @Post('logout')
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
    @Get('me')
    async getProfile(@Req() req: any) {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User ID not found in token');
        }
        const user = await this.authService.getProfile(userId);
        return {
            id: user._id.toString(),
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    @UseGuards(AuthGuard)
    @Get('users')
    async getAllUsers() {
        const users = await this.authService.getAllUsers();
        return users.map((user: any) => ({
            id: user._id.toString(),
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        }));
    }
}

