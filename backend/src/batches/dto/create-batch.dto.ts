import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsString, Length, Min } from 'class-validator';
import { IsFutureDate } from '../../common/validators/is-future-date.js';

export class CreateBatchDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsInt()
  @Min(1)
  maxWeightGrams!: number;

  // ISO 8601 date string
  @IsDateString({ strict: true })
  @IsFutureDate()
  orderDeadline!: string;
}
