import { parseCorsOrigins } from './parse-cors-origins.js';

describe('parseCorsOrigins', () => {
  it('returns each origin of a comma-separated list', () => {
    expect(
      parseCorsOrigins('http://localhost:5173,https://app.example.com'),
    ).toEqual(['http://localhost:5173', 'https://app.example.com']);
  });

  it('trims whitespace around each origin', () => {
    expect(
      parseCorsOrigins('  http://localhost:5173 , https://app.example.com '),
    ).toEqual(['http://localhost:5173', 'https://app.example.com']);
  });

  it('drops empty entries', () => {
    expect(parseCorsOrigins('http://localhost:5173,, ,')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('returns false when the value is unset', () => {
    expect(parseCorsOrigins(undefined)).toBe(false);
  });

  it('returns false when the value lists no origin', () => {
    expect(parseCorsOrigins(' , ')).toBe(false);
  });

  it.each([
    ['a trailing slash', 'http://localhost:5173/'],
    ['a path', 'https://app.example.com/app'],
    ['no scheme', 'localhost:5173'],
    ['a value that is not a URL', 'not a url'],
  ])('throws on an entry with %s', (_case, origin) => {
    expect(() => parseCorsOrigins(`http://localhost:5173,${origin}`)).toThrow(
      'Invalid CORS origin',
    );
  });
});
