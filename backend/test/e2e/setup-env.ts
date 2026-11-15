/**
 * Vitest setup file for the e2e suite. Runs in each worker before any test
 * file is imported, so `ConfigModule` sees these values: process.env takes
 * precedence over `.env`.
 *
 * Each Vitest worker gets its own database (`...-e2e-<pool id>`) on a shared
 * Mongo instance, so test files running in parallel never share data.
 */
import { getE2eDatabaseUri } from './e2e-mongodb-uri.js';

const poolId = process.env.VITEST_POOL_ID;
if (!poolId) {
  throw new Error(
    'VITEST_POOL_ID is not set: run the e2e suite through Vitest.',
  );
}

process.env.MONGODB_URI = getE2eDatabaseUri(poolId);
process.env.JWT_SECRET = 'e2e-test-secret-not-for-real-use-0123456789';
process.env.CORS_ORIGINS = 'http://allowed.test';
