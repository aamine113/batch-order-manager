import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { BatchesService } from './batches.service.js';
import { CreateBatchDto } from './dto/create-batch.dto.js';
import { UpdateBatchDto } from './dto/update-batch.dto.js';
import { BatchStatus } from './enums/batch-status.enum.js';
import { Batch } from './schemas/batch.schema.js';

const batchId = '64b7f0c2a1b2c3d4e5f60718';

const createDto: CreateBatchDto = {
  name: 'Sample batch',
  maxWeightGrams: 20000,
  orderDeadline: '2026-12-01T00:00:00.000Z',
};

function batchWith(overrides: Partial<Batch> = {}): Batch {
  return {
    name: 'Sample batch',
    maxWeightGrams: 20000,
    currentWeightGrams: 0,
    orderDeadline: new Date('2026-12-01T00:00:00.000Z'),
    status: BatchStatus.Draft,
    ...overrides,
  };
}

const batch = batchWith();

function queryResolving<T>(value: T) {
  return { exec: vi.fn().mockResolvedValue(value) };
}

// Mimics Mongoose orFail: exec rejects with the factory's error when nothing is found.
function queryOrFailResolving<T>(value: T | null) {
  return {
    orFail: vi.fn((onFail: () => Error) => ({
      exec: vi.fn(() =>
        value === null ? Promise.reject(onFail()) : Promise.resolve(value),
      ),
    })),
  };
}

describe('BatchesService', () => {
  let service: BatchesService;

  const batchModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: getModelToken(Batch.name), useValue: batchModel },
      ],
    }).compile();

    service = moduleRef.get(BatchesService);
  });

  describe('create', () => {
    it('returns the created batch', async () => {
      batchModel.create.mockResolvedValue(batch);

      await expect(service.create(createDto)).resolves.toBe(batch);
    });

    it('calls the model with the DTO', async () => {
      batchModel.create.mockResolvedValue(batch);

      await service.create(createDto);

      expect(batchModel.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('returns the list of batches', async () => {
      batchModel.find.mockReturnValue(queryResolving([batch]));

      await expect(service.findAll()).resolves.toEqual([batch]);
    });
  });

  describe('findOne', () => {
    it('returns the batch when found', async () => {
      batchModel.findById.mockReturnValue(queryOrFailResolving(batch));

      await expect(service.findOne(batchId)).resolves.toBe(batch);
      expect(batchModel.findById).toHaveBeenCalledWith(batchId);
    });

    it('throws NotFoundException when the batch does not exist', async () => {
      batchModel.findById.mockReturnValue(queryOrFailResolving(null));

      await expect(service.findOne(batchId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('returns the updated batch', async () => {
      const dto: UpdateBatchDto = { name: 'Renamed batch' };
      const updated = batchWith({ name: 'Renamed batch' });
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(updated));

      await expect(service.update(batchId, dto)).resolves.toBe(updated);
    });

    it('filters on the id only when maxWeightGrams is absent', async () => {
      const dto: UpdateBatchDto = { name: 'Renamed batch' };
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(batch));

      await service.update(batchId, dto);

      expect(batchModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: batchId },
        dto,
        { returnDocument: 'after', runValidators: true },
      );
    });

    it('requires currentWeightGrams <= the new maximum in the filter', async () => {
      const dto: UpdateBatchDto = { maxWeightGrams: 15000 };
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(batch));

      await service.update(batchId, dto);

      expect(batchModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: batchId, currentWeightGrams: { $lte: 15000 } },
        dto,
        { returnDocument: 'after', runValidators: true },
      );
    });

    it('throws NotFoundException when the batch does not exist', async () => {
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(null));
      batchModel.findById.mockReturnValue(queryResolving(null));

      await expect(
        service.update(batchId, { maxWeightGrams: 15000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the batch exists but the filter did not match', async () => {
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(null));
      batchModel.findById.mockReturnValue(
        queryResolving(batchWith({ currentWeightGrams: 18000 })),
      );

      await expect(
        service.update(batchId, { maxWeightGrams: 15000 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('transition', () => {
    it('returns the batch with its new status', async () => {
      const updated = batchWith({ status: BatchStatus.Open });
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(updated));

      await expect(
        service.transition(batchId, BatchStatus.Open),
      ).resolves.toBe(updated);
    });

    it('only matches statuses allowed to move to the target', async () => {
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(batch));

      await service.transition(batchId, BatchStatus.Open);

      expect(batchModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: batchId,
          status: { $in: [BatchStatus.Draft, BatchStatus.Closed] },
        },
        { status: BatchStatus.Open },
        { returnDocument: 'after', runValidators: true },
      );
    });

    it('matches no status when nothing can move to the target', async () => {
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(null));
      batchModel.findById.mockReturnValue(queryResolving(batch));

      await expect(
        service.transition(batchId, BatchStatus.Draft),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(batchModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: batchId, status: { $in: [] } },
        { status: BatchStatus.Draft },
        { returnDocument: 'after', runValidators: true },
      );
    });

    it('throws NotFoundException when the batch does not exist', async () => {
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(null));
      batchModel.findById.mockReturnValue(queryResolving(null));

      await expect(
        service.transition(batchId, BatchStatus.Open),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the current status cannot move to the target', async () => {
      batchModel.findOneAndUpdate.mockReturnValue(queryResolving(null));
      batchModel.findById.mockReturnValue(
        queryResolving(batchWith({ status: BatchStatus.Delivered })),
      );

      await expect(
        service.transition(batchId, BatchStatus.Open),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes only a draft batch and returns it', async () => {
      batchModel.findOneAndDelete.mockReturnValue(queryResolving(batch));

      await expect(service.remove(batchId)).resolves.toBe(batch);
      expect(batchModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: batchId,
        status: BatchStatus.Draft,
      });
    });

    it('throws NotFoundException when the batch does not exist', async () => {
      batchModel.findOneAndDelete.mockReturnValue(queryResolving(null));
      batchModel.findById.mockReturnValue(queryResolving(null));

      await expect(service.remove(batchId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ConflictException when the batch is not a draft', async () => {
      batchModel.findOneAndDelete.mockReturnValue(queryResolving(null));
      batchModel.findById.mockReturnValue(
        queryResolving(batchWith({ status: BatchStatus.Open })),
      );

      await expect(service.remove(batchId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
