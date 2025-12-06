import { IsEmail, IsString, IsEnum, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

// 2. Register DTO
export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Name must be less than 50 characters' })
    name: string;

    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(100, { message: 'Password must be less than 100 characters' })
    password: string;

    @IsEnum(UserRole, { message: 'Role must be either ADMIN or USER' })
    @IsNotEmpty({ message: 'Role is required' })
    role: UserRole;
}

// 3. Login DTO
export class LoginUserDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}