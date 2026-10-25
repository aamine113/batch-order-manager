import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BatchesService } from './batches.service.js';
import { CreateBatchDto } from './dto/create-batch.dto.js';
import { UpdateBatchDto } from './dto/update-batch.dto.js';
import { TransitionBatchDto } from './dto/transition-batch.dto.js';
import { MongoIdParamDto } from '../common/dto/mongo-id-param.dto.js';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }

  @Get()
  findAll() {
    return this.batchesService.findAll();
  }

  @Get(':id')
  findById(@Param() { id }: MongoIdParamDto) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  update(@Param() { id }: MongoIdParamDto, @Body() dto: UpdateBatchDto) {
    return this.batchesService.update(id, dto);
  }

  @Post(':id/transition')
  @HttpCode(200)
  transition(
    @Param() { id }: MongoIdParamDto,
    @Body() { status }: TransitionBatchDto,
  ) {
    return this.batchesService.transition(id, status);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param() { id }: MongoIdParamDto) {
    return this.batchesService.remove(id);
  }
}
