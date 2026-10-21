import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema.js';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { isDuplicateKeyError } from '../common/mongo/is-duplicate-key-error.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create(productDto: CreateProductDto): Promise<Product> {
    try {
      return await this.productModel.create(productDto);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('A product with this name already exists.');
      }
      throw error;
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.productModel
        .findByIdAndUpdate(id, dto, {
          returnDocument: 'after',
          runValidators: true,
        })
        .exec();

      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('A product with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    // TODO(milestone-3): refuse with 409 Conflict if any order line has ever
    // referenced this product (retire with available=false instead).
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
