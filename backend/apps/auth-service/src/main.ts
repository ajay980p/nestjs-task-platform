import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const port = parseInt(process.env.AUTH_PORT || '3001', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AUTH_HOST || 'localhost',
        port: port, // Ye Gateway se match hona chahiye
      },
    },
  );

  await app.listen();
  console.log(`Auth Microservice is listening on port ${port}`);
}
bootstrap();