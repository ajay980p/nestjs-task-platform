import 'dotenv/config'; // 👈 IMPORTANT: Ye line .env file load karegi
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ProjectServiceModule } from './project-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProjectServiceModule,
    {
      transport: Transport.TCP,
      options: {
        // Ab ye values .env file se aayengi
        host: process.env.PROJECT_HOST || 'localhost',
        port: Number(process.env.PROJECT_PORT) || 3002,
      },
    },
  );

  await app.listen();
  console.log(`Project Microservice is listening on port ${process.env.PROJECT_PORT}`);
}
bootstrap();