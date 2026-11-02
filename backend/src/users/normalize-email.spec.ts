import { normalizeEmail } from './normalize-email.js';

describe('normalizeEmail', () => {
  it('trims surrounding whitespace and lowercases', () => {
    expect(normalizeEmail('  Jane@Example.COM ')).toBe('jane@example.com');
  });

  it('leaves an already normalised email unchanged', () => {
    expect(normalizeEmail('jane@example.com')).toBe('jane@example.com');
  });
});
