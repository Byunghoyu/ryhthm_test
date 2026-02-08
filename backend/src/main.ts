import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정 - 프론트엔드 연결
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  await app.listen(3001);
  console.log('🎵 Rhythm Game Backend running on http://localhost:3001');
}
bootstrap();
