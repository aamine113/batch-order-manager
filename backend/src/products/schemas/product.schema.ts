import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { baseSchemaOptions } from '../../common/schema/base-schema-options.js';

@Schema(baseSchemaOptions)
export class Product {
  @Prop({
    required: true,
    minLength: 2,
    maxLength: 50,
    trim: true,
  })
  name!: string;

  @Prop({ type: String, required: false, maxLength: 1000, trim: true })
  description?: string;

  @Prop({
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'unitprice must be an integer number of cents',
    },
  })
  unitPrice!: number;

  @Prop({
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'unitWeightGrams must be an integer',
    },
  })
  unitWeightGrams!: number;

  @Prop({ required: true, default: true })
  available!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
