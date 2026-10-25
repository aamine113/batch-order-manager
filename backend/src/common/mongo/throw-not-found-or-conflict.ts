import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

// Called after a conditional write matched nothing: tells an unknown id
// (404) apart from a document whose state did not meet the condition (409).
export async function throwNotFoundOrConflict<T>(
  model: Model<T>,
  id: string,
  notFoundMessage: string,
  conflictMessage: string,
): Promise<never> {
  const document = await model.findById(id).exec();
  if (!document) {
    throw new NotFoundException(notFoundMessage);
  }
  throw new ConflictException(conflictMessage);
}
