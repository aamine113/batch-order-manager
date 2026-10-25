import { IsEnum } from 'class-validator';
import { BatchStatus } from '../enums/batch-status.enum.js';

export class TransitionBatchDto {
  @IsEnum(BatchStatus)
  status!: BatchStatus;
}
