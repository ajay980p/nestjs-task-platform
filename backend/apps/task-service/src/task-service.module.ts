import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices'; // 👈 Client Import
import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { Task, TaskSchema } from './schemas/task.schema';

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

    // Register Task schema for database operations
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),

    // Register PROJECT_SERVICE client to validate project existence before creating tasks
    ClientsModule.registerAsync([
      {
        name: 'PROJECT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('PROJECT_HOST'),
            port: configService.get('PROJECT_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [TaskServiceController],
  providers: [TaskServiceService],
})
export class TaskServiceModule { }