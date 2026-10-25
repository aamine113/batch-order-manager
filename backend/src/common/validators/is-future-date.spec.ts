import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsFutureDate, isFutureDate } from './is-future-date.js';

// The clock is frozen at this instant, so results never depend on the real date.
const now = new Date('2100-06-15T12:00:00Z');

class Sample {
  @IsFutureDate()
  date!: string;
}

async function errorsFor(date: unknown) {
  return validate(plainToInstance(Sample, { date }));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isFutureDate', () => {
  it('accepts a date later than now', () => {
    expect(isFutureDate('2100-06-15T12:00:01Z')).toBe(true);
  });

  it('rejects the current instant', () => {
    expect(isFutureDate('2100-06-15T12:00:00Z')).toBe(false);
  });

  it('rejects a date earlier than now', () => {
    expect(isFutureDate('2100-06-14T12:00:00Z')).toBe(false);
  });

  it('rejects a string that is not a date', () => {
    expect(isFutureDate('not a date')).toBe(false);
  });

  it('rejects a value that is not a string', () => {
    expect(isFutureDate(new Date('2101-01-01T00:00:00Z'))).toBe(false);
  });

  it('reads the clock on each call', () => {
    expect(isFutureDate('2100-07-01T00:00:00Z')).toBe(true);

    vi.setSystemTime(new Date('2100-08-01T00:00:00Z'));

    expect(isFutureDate('2100-07-01T00:00:00Z')).toBe(false);
  });
});

describe('IsFutureDate', () => {
  it('passes validation for a future date', async () => {
    expect(await errorsFor('2100-06-16T00:00:00Z')).toHaveLength(0);
  });

  it('fails validation with the default message for a past date', async () => {
    const errors = await errorsFor('2100-06-14T00:00:00Z');

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isFutureDate: 'date must be a future date',
    });
  });
});
