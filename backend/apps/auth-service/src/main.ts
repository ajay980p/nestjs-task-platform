import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AuthServiceModule } from './auth-service.module';

// Bootstrap function to initialize and start the auth microservice
async function bootstrap() {
  const port = parseInt(process.env.AUTH_PORT || '3001', 10);

  // Create TCP microservice instance with configuration from environment variables
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AUTH_HOST || 'localhost',
        port: port, // Port must match with API Gateway configuration
      },
    },
  );

  await app.listen();
  console.log(`Auth Microservice is listening on port ${port}`);
}
bootstrap();