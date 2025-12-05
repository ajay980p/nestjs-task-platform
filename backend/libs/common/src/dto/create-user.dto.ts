import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';

// 1. Role Enum (Ye bhi share hona chahiye)
export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

// 2. Register DTO
export class CreateUserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @IsEnum(UserRole)
    role: UserRole;
}

// 3. Login DTO
export class LoginUserDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}