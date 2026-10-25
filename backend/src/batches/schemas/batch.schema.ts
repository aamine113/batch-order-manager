import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/schema/base-schema-options.js';
import { BatchStatus } from '../enums/batch-status.enum.js';

export type BatchDocument = HydratedDocument<Batch>;

@Schema(baseSchemaOptions)
export class Batch {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'maxWeightGrams must be an integer',
    },
  })
  maxWeightGrams!: number;

  @Prop({
    required: true,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'currentWeightGrams must be an integer',
    },
  })
  currentWeightGrams!: number;

  @Prop({ type: Date, required: true })
  orderDeadline!: Date;

  @Prop({
    type: String,
    enum: Object.values(BatchStatus),
    required: true,
    default: BatchStatus.Draft,
  })
  status!: BatchStatus;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);
