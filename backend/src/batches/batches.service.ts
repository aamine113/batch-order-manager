import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Batch } from './schemas/batch.schema.js';
import { BatchStatus } from './enums/batch-status.enum.js';
import { CreateBatchDto } from './dto/create-batch.dto.js';
import { UpdateBatchDto } from './dto/update-batch.dto.js';
import { canTransition } from './batch-transitions.js';
import {
  BATCH_DELETE_NOT_DRAFT,
  BATCH_MAX_WEIGHT_BELOW_CURRENT,
  BATCH_NOT_FOUND,
  BATCH_TRANSITION_NOT_ALLOWED,
} from './batches.constants.js';
import { throwNotFoundOrConflict } from '../common/mongo/throw-not-found-or-conflict.js';

@Injectable()
export class BatchesService {
  constructor(
    @InjectModel(Batch.name) private readonly batchModel: Model<Batch>,
  ) {}

  async create(dto: CreateBatchDto): Promise<Batch> {
    return this.batchModel.create(dto);
  }

  async findAll(): Promise<Batch[]> {
    return this.batchModel.find().exec();
  }

  async findOne(id: string): Promise<Batch> {
    return this.batchModel
      .findById(id)
      .orFail(() => new NotFoundException(BATCH_NOT_FOUND))
      .exec();
  }

  async update(id: string, dto: UpdateBatchDto): Promise<Batch> {
    // The weight check sits in the filter so it is atomic with the write.
    const filter =
      dto.maxWeightGrams === undefined
        ? { _id: id }
        : { _id: id, currentWeightGrams: { $lte: dto.maxWeightGrams } };

    const batch = await this.batchModel
      .findOneAndUpdate(filter, dto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();

    if (!batch) {
      return throwNotFoundOrConflict(
        this.batchModel,
        id,
        BATCH_NOT_FOUND,
        BATCH_MAX_WEIGHT_BELOW_CURRENT,
      );
    }
    return batch;
  }

  async transition(id: string, target: BatchStatus): Promise<Batch> {
    // Only statuses allowed to move to the target are in the filter, so the
    // rule check and the write are one atomic operation.
    const sources = Object.values(BatchStatus).filter((from) =>
      canTransition(from, target),
    );

    const batch = await this.batchModel
      .findOneAndUpdate(
        { _id: id, status: { $in: sources } },
        { status: target },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!batch) {
      return throwNotFoundOrConflict(
        this.batchModel,
        id,
        BATCH_NOT_FOUND,
        BATCH_TRANSITION_NOT_ALLOWED,
      );
    }
    return batch;
  }

  async remove(id: string): Promise<Batch> {
    const batch = await this.batchModel
      .findOneAndDelete({ _id: id, status: BatchStatus.Draft })
      .exec();

    if (!batch) {
      return throwNotFoundOrConflict(
        this.batchModel,
        id,
        BATCH_NOT_FOUND,
        BATCH_DELETE_NOT_DRAFT,
      );
    }
    return batch;
  }
}
