import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

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
  unitPrice!: number;

  @IsInt()
  @Min(1)
  unitWeightGrams!: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
