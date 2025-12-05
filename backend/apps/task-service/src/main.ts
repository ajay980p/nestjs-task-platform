import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { TaskServiceModule } from './task-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TaskServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.TASK_HOST || 'localhost',
        port: Number(process.env.TASK_PORT) || 3003,
      },
    },
  );
  await app.listen();
  console.log(`Task Microservice is listening on port ${process.env.TASK_PORT}`);
}
bootstrap();