import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parser middleware
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
