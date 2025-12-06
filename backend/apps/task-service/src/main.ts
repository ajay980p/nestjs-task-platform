import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { TaskServiceModule } from './task-service.module';

// Bootstrap function to initialize and start the task microservice
async function bootstrap() {
  // Create TCP microservice instance with configuration from environment variables
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TaskServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.TASK_HOST || 'localhost',
        port: Number(process.env.TASK_PORT) || 3003, // Port must match with API Gateway configuration
      },
    },
  );
  await app.listen();
  console.log(`Task Microservice is listening on port ${process.env.TASK_PORT}`);
}
bootstrap();