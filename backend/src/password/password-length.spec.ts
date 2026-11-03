import { isValidPasswordLength } from './password-length.js';

describe('isValidPasswordLength', () => {
  it('rejects a password shorter than 12 characters', () => {
    expect(isValidPasswordLength('a'.repeat(11))).toBe(false);
  });

  it('accepts a password of exactly 12 characters', () => {
    expect(isValidPasswordLength('a'.repeat(12))).toBe(true);
  });

  it('accepts a password of exactly 128 characters', () => {
    expect(isValidPasswordLength('a'.repeat(128))).toBe(true);
  });

  it('rejects a password longer than 128 characters', () => {
    expect(isValidPasswordLength('a'.repeat(129))).toBe(false);
  });

  // Each emoji is one code point but two UTF-16 units.
  it('counts code points, not UTF-16 units', () => {
    expect(isValidPasswordLength('🔑'.repeat(11))).toBe(false);
  });

  it('accepts 128 emoji even though they are 256 UTF-16 units', () => {
    expect(isValidPasswordLength('🔑'.repeat(128))).toBe(true);
  });
});
