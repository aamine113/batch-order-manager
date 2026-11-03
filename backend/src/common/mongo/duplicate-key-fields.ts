import { isDuplicateKeyError } from './is-duplicate-key-error.js';

// Names the fields of the unique index that rejected the write, read from the
// server error's keyPattern. Empty for any other error.
export function duplicateKeyFields(error: unknown): string[] {
  if (!isDuplicateKeyError(error)) {
    return [];
  }
  const { keyPattern } = error as { keyPattern?: Record<string, unknown> };
  return keyPattern ? Object.keys(keyPattern) : [];
}
