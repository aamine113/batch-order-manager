// An expected seed failure. The entry script prints its message as-is, so it
// must be readable and contain no sensitive data.
export class AdminSeedError extends Error {
  override name = 'AdminSeedError';
}
