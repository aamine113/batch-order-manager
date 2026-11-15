/**
 * Mongo instance used by the e2e suite: the Docker Compose replica set,
 * locally and in CI. Deliberately not configurable.
 */
export const E2E_MONGODB_HOST = 'localhost:27017';
const E2E_MONGODB_OPTIONS = 'replicaSet=rs0';

export const E2E_DB_NAME_PREFIX = 'batch-order-manager-e2e-';
export const E2E_DB_NAME_PATTERN = new RegExp(`^${E2E_DB_NAME_PREFIX}\\d+$`);

/** Instance URI without a database name, for the reachability check. */
export const E2E_MONGODB_URI = `mongodb://${E2E_MONGODB_HOST}/?${E2E_MONGODB_OPTIONS}`;

/** URI of the database owned by one Vitest worker. */
export function getE2eDatabaseUri(poolId: string): string {
  return `mongodb://${E2E_MONGODB_HOST}/${E2E_DB_NAME_PREFIX}${poolId}?${E2E_MONGODB_OPTIONS}`;
}
