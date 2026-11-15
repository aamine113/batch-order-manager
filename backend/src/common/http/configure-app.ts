import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { BODY_SIZE_LIMIT } from './http.constants.js';
import { parseCorsOrigins } from './parse-cors-origins.js';

/**
 * Applies the HTTP middleware shared by `main.ts` and the e2e app, so tests
 * run against the same security headers, CORS policy and body limits.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);
  app.use(helmet());
  app.enableCors({
    origin: parseCorsOrigins(config.get<string>('CORS_ORIGINS')),
  });
  app.useBodyParser('json', { limit: BODY_SIZE_LIMIT });
  app.useBodyParser('urlencoded', { limit: BODY_SIZE_LIMIT, extended: false });
}
