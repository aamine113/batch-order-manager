import { getConnectionToken } from '@nestjs/mongoose';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mongoose';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/common/http/configure-app.js';
import { E2E_DB_NAME_PATTERN } from './e2e-mongodb-uri.js';

/**
 * Returns the app's connection, checked against the live database name: the
 * helpers below wipe and drop it, so refuse anything that is not a throwaway
 * e2e database.
 */
function getConnection(app: NestExpressApplication): Connection {
  const connection = app.get<Connection>(getConnectionToken());
  if (!E2E_DB_NAME_PATTERN.test(connection.name)) {
    throw new Error(
      `Refusing to run e2e tests against database "${connection.name}".`,
    );
  }
  return connection;
}

/**
 * Boots the real `AppModule` with the same HTTP configuration as `main.ts`,
 * against the worker's e2e database (see `setup-env.ts`). Call once per test
 * file, in `beforeAll`.
 */
export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  try {
    await app.init();
    // autoIndex builds indexes in the background: wait for every model, so
    // tests that rely on a unique index do not race the build.
    const { models } = getConnection(app);
    await Promise.all(Object.values(models).map((model) => model.init()));
  } catch (error) {
    // The caller never receives the app, so it cannot close it. A failing
    // close must not replace the original error.
    await app.close().catch(() => undefined);
    throw error;
  }
  return app;
}

/** Empties every collection but keeps the indexes. Call in `beforeEach`. */
export async function clearDatabase(
  app: NestExpressApplication,
): Promise<void> {
  const collections = Object.values(getConnection(app).collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

/**
 * Drops the worker's database and closes the app. Call in `afterAll`.
 */
export async function closeTestApp(
  app: NestExpressApplication | undefined,
): Promise<void> {
  if (!app) {
    return;
  }
  try {
    await getConnection(app).dropDatabase();
  } finally {
    await app.close();
  }
}
