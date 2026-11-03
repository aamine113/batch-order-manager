import { duplicateKeyFields } from './duplicate-key-fields.js';

describe('duplicateKeyFields', () => {
  it('returns the fields of the index that rejected the write', () => {
    expect(
      duplicateKeyFields({ code: 11000, keyPattern: { email: 1 } }),
    ).toEqual(['email']);
  });

  it('returns an empty array for a duplicate key error without keyPattern', () => {
    expect(duplicateKeyFields({ code: 11000 })).toEqual([]);
  });

  it('returns an empty array for any other code', () => {
    expect(duplicateKeyFields({ code: 123, keyPattern: { email: 1 } })).toEqual(
      [],
    );
  });

  it('returns an empty array for any other error', () => {
    expect(duplicateKeyFields(new Error('Unexpected error'))).toEqual([]);
  });
});
