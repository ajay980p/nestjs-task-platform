import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ProjectServiceModule } from './project-service.module';

// Bootstrap function to initialize and start the project microservice
async function bootstrap() {
  // Create TCP microservice instance with configuration from environment variables
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProjectServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.PROJECT_HOST || 'localhost',
        port: Number(process.env.PROJECT_PORT) || 3002, // Port must match with API Gateway configuration
      },
    },
  );

  await app.listen();
  console.log(`Project Microservice is listening on port ${process.env.PROJECT_PORT}`);
}
bootstrap();