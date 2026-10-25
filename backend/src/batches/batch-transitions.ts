import { BatchStatus } from './enums/batch-status.enum.js';

const allowedTransitions: Record<BatchStatus, readonly BatchStatus[]> = {
  [BatchStatus.Draft]: [BatchStatus.Open],
  [BatchStatus.Open]: [BatchStatus.Closed],
  [BatchStatus.Closed]: [BatchStatus.Shipped, BatchStatus.Open],
  [BatchStatus.Shipped]: [BatchStatus.Delivered],
  [BatchStatus.Delivered]: [],
};

export function canTransition(from: BatchStatus, to: BatchStatus): boolean {
  return allowedTransitions[from].includes(to);
}
