import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, LoginUserDto } from '../../../libs/common/src/dto/create-user.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) { }

  // 1. REGISTER LOGIC
  async register(createUserDto: CreateUserDto) {
    const { email, password, name, role } = createUserDto;

    // Check if user exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new RpcException({
        status: 409,
        message: 'User already exists',
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save User
    const user = new this.userModel({
      name,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();

    return { message: 'User registered successfully', userId: user._id.toString() };
  }



  // 2. LOGIN LOGIC
  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // Find User
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new RpcException({
        status: 401,
        message: 'Invalid credentials',
      });
    }

    // Check Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new RpcException({
        status: 401,
        message: 'Invalid credentials',
      });
    }

    // Generate Token - Convert _id to string for JWT payload
    try {
      const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };
      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      if (error.message && error.message.includes('secretOrPrivateKey')) {
        throw new RpcException({
          status: 401,
          message: 'JWT_SECRET is missing. Please add JWT_SECRET to your .env file',
        });
      }
      throw new RpcException({
        status: 500,
        message: 'Failed to generate token: ' + error.message,
      });
    }
  }



  // 3. VALIDATE TOKEN (Gateway use karega baad mein)
  async validateUser(userId: string) {
    return this.userModel.findById(userId).select('-password');
  }


  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new RpcException('Invalid or Expired Token');
    }
  }
}