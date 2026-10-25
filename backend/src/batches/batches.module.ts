import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Batch, BatchSchema } from './schemas/batch.schema.js';
import { BatchesService } from './batches.service.js';
import { BatchesController } from './batches.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }]),
  ],
  providers: [BatchesService],
  controllers: [BatchesController],
})
export class BatchesModule {}
