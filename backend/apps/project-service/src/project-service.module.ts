import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectServiceController } from './project-service.controller';
import { ProjectServiceService } from './project-service.service';
import { Project, ProjectSchema } from './schemas/project.schema';

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

    // Register Project schema for database operations
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [ProjectServiceController],
  providers: [ProjectServiceService],
})
export class ProjectServiceModule { }