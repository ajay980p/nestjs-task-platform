import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // New Imports
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    // 1. Config Module Load Kar (Taaki .env padh sake)
    ConfigModule.forRoot({
      isGlobal: true, // Ye zaroori hai taaki baaki modules bhi isse use kar sakein
      envFilePath: './.env', // Root folder se .env uthayega
    }),

    // 2. Database Connection (ASYNC way mein, taaki ConfigService inject ho sake)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), // .env se value li
      }),
      inject: [ConfigService],
    }),

    // 3. Load User Schema (Ye same rahega)
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // 4. JWT Setup (ASYNC way mein)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // .env se secret liya
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule { }