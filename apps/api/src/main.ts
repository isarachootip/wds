import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';

// Configure global decimal precision and rounding to match Thai Revenue Code standards
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

async function bootstrap() {
  const logger = new Logger('WDS-Bootstrap');

  // Verify server timezone is set to UTC
  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  logger.log(`Server initialized. Runtime Timezone: ${currentTz}, System UTC: ${new Date().toISOString()}`);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Thai Watsadu WDS API Gateway running on: http://localhost:${port}/api/v1`);
}

bootstrap();
