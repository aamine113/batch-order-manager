import mongoose from 'mongoose';
import { E2E_MONGODB_HOST, E2E_MONGODB_URI } from './e2e-mongodb-uri.js';

const SERVER_SELECTION_TIMEOUT_MS = 3000;

/**
 * Runs once before any worker starts. Fails the whole run with one clear
 * message when Mongo is unreachable, instead of a hook timeout per test file.
 */
export default async function setup(): Promise<void> {
  const connection = mongoose.createConnection(E2E_MONGODB_URI, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  });
  try {
    await connection.asPromise();
  } catch (error) {
    // The driver error goes in the message, not in `cause`: its `name` is
    // read-only, which crashes Vitest's error printer.
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot reach MongoDB at ${E2E_MONGODB_HOST} (${reason}). Start it with "docker compose up -d" from the repository root.`,
    );
  } finally {
    await connection.close();
  }
}
