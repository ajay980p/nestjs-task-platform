import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { ProjectsController } from './controllers/projects.controller';
import { TasksController } from './controllers/tasks.controller';

// Services
import { AuthService } from './services/auth.service';
import { ProjectsService } from './services/projects.service';
import { TasksService } from './services/tasks.service';

@Module({
  imports: [
    // 1. Config Module Global Load (Sabse pehle ye chalega)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),

    // 2. Clients Module (Async Registration)
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AUTH_HOST'), // .env se 'localhost'
            port: configService.get('AUTH_PORT'), // .env se 3001
          },
        }),
        inject: [ConfigService],
      },
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
      {
        name: 'TASK_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('TASK_HOST'),
            port: configService.get('TASK_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController, ProjectsController, TasksController],
  providers: [AuthService, ProjectsService, TasksService],
})
export class AppModule { }