import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { throwNotFoundOrConflict } from './throw-not-found-or-conflict.js';

const id = '64b7f0c2a1b2c3d4e5f60718';

function modelFinding(document: { name: string } | null) {
  const findById = vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(document),
  });
  // Only findById is used by the helper, so a partial mock is enough.
  return {
    model: { findById } as unknown as Model<{ name: string }>,
    findById,
  };
}

describe('throwNotFoundOrConflict', () => {
  it('throws NotFoundException with the given message when the document does not exist', async () => {
    const { model } = modelFinding(null);

    await expect(
      throwNotFoundOrConflict(model, id, 'Not found.', 'Conflict.'),
    ).rejects.toThrow(new NotFoundException('Not found.'));
  });

  it('throws ConflictException with the given message when the document exists', async () => {
    const { model } = modelFinding({ name: 'Sample' });

    await expect(
      throwNotFoundOrConflict(model, id, 'Not found.', 'Conflict.'),
    ).rejects.toThrow(new ConflictException('Conflict.'));
  });

  it('looks the document up by id', async () => {
    const { model, findById } = modelFinding(null);

    await expect(
      throwNotFoundOrConflict(model, id, 'Not found.', 'Conflict.'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(findById).toHaveBeenCalledWith(id);
  });
});
