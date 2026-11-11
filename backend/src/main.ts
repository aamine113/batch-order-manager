import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { BODY_SIZE_LIMIT } from './common/http/http.constants.js';
import { parseCorsOrigins } from './common/http/parse-cors-origins.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.enableCors({ origin: parseCorsOrigins(process.env.CORS_ORIGINS) });
  app.useBodyParser('json', { limit: BODY_SIZE_LIMIT });
  app.useBodyParser('urlencoded', { limit: BODY_SIZE_LIMIT, extended: false });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
