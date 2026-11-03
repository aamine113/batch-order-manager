import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './password.constants.js';

// Code points on purpose: UTF-16 units would count an emoji twice, and
// graphemes would let combining marks stretch a "128-character" password to
// any size.
export function isValidPasswordLength(password: string): boolean {
  // oxlint-disable-next-line typescript/no-misused-spread
  const length = [...password].length;
  return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH;
}
