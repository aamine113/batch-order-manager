import { canTransition } from './batch-transitions.js';
import { BatchStatus } from './enums/batch-status.enum.js';

const allowedPairs: ReadonlyArray<[BatchStatus, BatchStatus]> = [
  [BatchStatus.Draft, BatchStatus.Open],
  [BatchStatus.Open, BatchStatus.Closed],
  [BatchStatus.Closed, BatchStatus.Shipped],
  [BatchStatus.Shipped, BatchStatus.Delivered],
  [BatchStatus.Closed, BatchStatus.Open],
];

const statuses = Object.values(BatchStatus);

const allPairs = statuses.flatMap((from) =>
  statuses.map((to) => ({
    from,
    to,
    allowed: allowedPairs.some(([a, b]) => a === from && b === to),
  })),
);

describe('canTransition', () => {
  it('covers all 25 status combinations', () => {
    expect(allPairs).toHaveLength(25);
  });

  it.each(allPairs.filter((pair) => pair.allowed))(
    'allows $from -> $to',
    ({ from, to }) => {
      expect(canTransition(from, to)).toBe(true);
    },
  );

  it.each(allPairs.filter((pair) => !pair.allowed))(
    'forbids $from -> $to',
    ({ from, to }) => {
      expect(canTransition(from, to)).toBe(false);
    },
  );
});
