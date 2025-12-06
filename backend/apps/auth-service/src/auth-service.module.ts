import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // New Imports
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    // Load configuration module to access environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),

    // Connect to MongoDB database using connection URI from environment variables
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // Register User schema for database operations
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // Configure JWT module with secret key and token expiration settings
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!jwtSecret) {
          throw new Error('JWT_SECRET is required. Please add it to your .env file');
        }

        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '1d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule { }