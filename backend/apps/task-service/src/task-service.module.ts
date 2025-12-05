import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices'; // 👈 Client Import
import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { Task, TaskSchema } from './schemas/task.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),

    // 1. Database Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // 2. Register Schema
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),

    // 3. Register PROJECT_SERVICE (Taaki hum project validate kar sakein)
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