import { isDuplicateKeyError } from './is-duplicate-key-error.js';

describe('isDuplicateKeyError', () => {
  it('returns true for an error with code 11000', () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
  });

  it('returns false for an error with another code', () => {
    expect(isDuplicateKeyError({ code: 123 })).toBe(false);
  });

  it('returns false for an object without a code', () => {
    expect(isDuplicateKeyError({ message: 'boom' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDuplicateKeyError(null)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isDuplicateKeyError('11000')).toBe(false);
  });
});
