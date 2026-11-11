import { trusted } from 'mongoose';

/**
 * Marks a query-filter operator object as built by the server, so the
 * connection's `sanitizeFilter` leaves it as is. Wrap the operator object
 * only (`{ status: trustedOperator({ $in: values }) }`), never a whole filter.
 * Never pass client input through it.
 */
export function trustedOperator<T extends Record<`$${string}`, unknown>>(
  operator: T,
): T {
  return trusted(operator);
}
