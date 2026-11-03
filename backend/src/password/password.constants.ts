import type { Algorithm, Options } from '@node-rs/argon2';

// Algorithm is a const enum that is empty at runtime and cannot be inlined
// under isolatedModules, so its Argon2id value (2) is written out here.
const ARGON2ID: Algorithm = 2;

// OWASP baseline for argon2id (19 MiB, 2 passes, 1 lane). Each hash string
// stores its own parameters, so changing these does not break old hashes.
export const ARGON2_OPTIONS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Shared by every flow that sets a password. Lengths count Unicode code
// points, not UTF-16 units, so an emoji counts as one character.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_LENGTH_MESSAGE = `The password must be ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters long.`;
