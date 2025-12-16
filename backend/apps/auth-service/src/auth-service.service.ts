import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, LoginUserDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) { }

  // Register a new user with hashed password and return success message
  async register(createUserDto: CreateUserDto) {
    try {
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
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to register user',
      });
    }
  }



  // Authenticate user credentials and return JWT access token with user details
  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // Find User
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new RpcException({
        status: 401,
        message: 'Invalid credentials! Please check your email and password.',
      });
    }

    // Check Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new RpcException({
        status: 401,
        message: 'Invalid credentials! Please check your email and password.',
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



  // Validate and return user details by user ID (excluding password)
  async validateUser(userId: string) {
    return this.userModel.findById(userId).select('-password');
  }

  // Get all users with USER role (excluding password and ADMIN users)
  async getAllUsers() {
    try {
      const users = await this.userModel.find({ role: 'USER' }).select('-password').exec();
      return users || [];
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch users',
      });
    }
  }

  // Verify JWT token and return decoded payload or throw exception if invalid
  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new RpcException('Invalid or Expired Token');
    }
  }
}