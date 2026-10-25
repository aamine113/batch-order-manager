import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BatchesController } from './batches.controller.js';
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

const batch: Batch = {
  name: 'Sample batch',
  maxWeightGrams: 20000,
  currentWeightGrams: 0,
  orderDeadline: new Date('2026-12-01T00:00:00.000Z'),
  status: BatchStatus.Draft,
};

describe('BatchesController', () => {
  let controller: BatchesController;

  const batchesService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    transition: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [BatchesController],
      providers: [{ provide: BatchesService, useValue: batchesService }],
    }).compile();

    controller = moduleRef.get(BatchesController);
  });

  describe('create', () => {
    it('passes the DTO to the service and returns the created batch', async () => {
      batchesService.create.mockResolvedValue(batch);

      await expect(controller.create(createDto)).resolves.toBe(batch);
      expect(batchesService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('returns the list from the service', async () => {
      batchesService.findAll.mockResolvedValue([batch]);

      await expect(controller.findAll()).resolves.toEqual([batch]);
    });
  });

  describe('findById', () => {
    it('looks the batch up by id and returns it', async () => {
      batchesService.findOne.mockResolvedValue(batch);

      await expect(controller.findById({ id: batchId })).resolves.toBe(batch);
      expect(batchesService.findOne).toHaveBeenCalledWith(batchId);
    });

    it('lets NotFoundException from the service propagate', async () => {
      batchesService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findById({ id: batchId })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateBatchDto = { maxWeightGrams: 25000 };

    it('passes the id and DTO to the service and returns the updated batch', async () => {
      batchesService.update.mockResolvedValue(batch);

      await expect(controller.update({ id: batchId }, dto)).resolves.toBe(
        batch,
      );
      expect(batchesService.update).toHaveBeenCalledWith(batchId, dto);
    });

    it('lets NotFoundException from the service propagate', async () => {
      batchesService.update.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update({ id: batchId }, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets ConflictException from the service propagate', async () => {
      batchesService.update.mockRejectedValue(new ConflictException());

      await expect(
        controller.update({ id: batchId }, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('transition', () => {
    const body = { status: BatchStatus.Open };

    it('passes the id and target status to the service and returns the batch', async () => {
      const opened: Batch = {
        name: 'Sample batch',
        maxWeightGrams: 20000,
        currentWeightGrams: 0,
        orderDeadline: new Date('2026-12-01T00:00:00.000Z'),
        status: BatchStatus.Open,
      };
      batchesService.transition.mockResolvedValue(opened);

      await expect(controller.transition({ id: batchId }, body)).resolves.toBe(
        opened,
      );
      expect(batchesService.transition).toHaveBeenCalledWith(
        batchId,
        BatchStatus.Open,
      );
    });

    it('lets NotFoundException from the service propagate', async () => {
      batchesService.transition.mockRejectedValue(new NotFoundException());

      await expect(
        controller.transition({ id: batchId }, body),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets ConflictException from the service propagate', async () => {
      batchesService.transition.mockRejectedValue(new ConflictException());

      await expect(
        controller.transition({ id: batchId }, body),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('passes the id to the service', async () => {
      batchesService.remove.mockResolvedValue(batch);

      await controller.remove({ id: batchId });

      expect(batchesService.remove).toHaveBeenCalledWith(batchId);
    });

    it('lets NotFoundException from the service propagate', async () => {
      batchesService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove({ id: batchId })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lets ConflictException from the service propagate', async () => {
      batchesService.remove.mockRejectedValue(new ConflictException());

      await expect(controller.remove({ id: batchId })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
