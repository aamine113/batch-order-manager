import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PRODUCT_UNIT_PRICE_MAX_CENTS,
  PRODUCT_UNIT_WEIGHT_MAX_GRAMS,
} from '../products.constants.js';

export class CreateProductDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // Price in cents
  @IsInt()
  @Min(0)
  @Max(PRODUCT_UNIT_PRICE_MAX_CENTS)
  unitPrice!: number;

  @IsInt()
  @Min(1)
  @Max(PRODUCT_UNIT_WEIGHT_MAX_GRAMS)
  unitWeightGrams!: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
