import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { IsFutureDate } from '../../common/validators/is-future-date.js';
import { BATCH_WEIGHT_LIMIT_MAX_GRAMS } from '../batches.constants.js';

export class CreateBatchDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(BATCH_WEIGHT_LIMIT_MAX_GRAMS)
  maxWeightGrams!: number;

  // ISO 8601 date string
  @IsDateString({ strict: true })
  @IsFutureDate()
  orderDeadline!: string;
}
