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
        return this.authService.login(loginUserDto, res);
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        return this.authService.logout(res);
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async getProfile(@Req() req: any) {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User ID not found in token');
        }
        return this.authService.getProfile(userId);
    }

    @UseGuards(AuthGuard)
    @Get('users')
    getAllUsers() {
        return this.authService.getAllUsers();
    }
}

