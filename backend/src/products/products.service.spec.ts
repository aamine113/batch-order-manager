import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';
import { Product } from './schemas/product.schema.js';

const productId = '64b7f0c2a1b2c3d4e5f60718';

const createDto: CreateProductDto = {
  name: 'Sample product',
  unitPrice: 1200,
  unitWeightGrams: 1000,
};

const product: Product = {
  name: 'Sample product',
  unitPrice: 1200,
  unitWeightGrams: 1000,
  available: true,
};

const duplicateKeyError = { code: 11000 };

function queryResolving<T>(value: T) {
  return { exec: vi.fn().mockResolvedValue(value) };
}

function queryRejecting(error: unknown) {
  return { exec: vi.fn().mockRejectedValue(error) };
}

describe('ProductsService', () => {
  let service: ProductsService;

  const productModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: productModel },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  describe('create', () => {
    it('returns the created product', async () => {
      productModel.create.mockResolvedValue(product);

      await expect(service.create(createDto)).resolves.toBe(product);
    });

    it('calls the model with the DTO', async () => {
      productModel.create.mockResolvedValue(product);

      await service.create(createDto);

      expect(productModel.create).toHaveBeenCalledWith(createDto);
    });

    it('throws ConflictException on a duplicate key error', async () => {
      productModel.create.mockRejectedValue(duplicateKeyError);

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows any other error unchanged', async () => {
      const error = new Error('connection lost');
      productModel.create.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toBe(error);
    });
  });

  describe('findAll', () => {
    it('returns the list of products', async () => {
      productModel.find.mockReturnValue(queryResolving([product]));

      await expect(service.findAll()).resolves.toEqual([product]);
    });
  });

  describe('findOne', () => {
    it('returns the product when found', async () => {
      productModel.findById.mockReturnValue(queryResolving(product));

      await expect(service.findOne(productId)).resolves.toBe(product);
      expect(productModel.findById).toHaveBeenCalledWith(productId);
    });

    it('throws NotFoundException when the product does not exist', async () => {
      productModel.findById.mockReturnValue(queryResolving(null));

      await expect(service.findOne(productId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = { unitPrice: 1500 };

    it('returns the updated product', async () => {
      const updated: Product = {
        name: 'Sample product',
        unitPrice: 1500,
        unitWeightGrams: 1000,
        available: true,
      };
      productModel.findByIdAndUpdate.mockReturnValue(queryResolving(updated));

      await expect(service.update(productId, updateDto)).resolves.toBe(updated);
    });

    it('calls findByIdAndUpdate with returnDocument "after" and runValidators', async () => {
      productModel.findByIdAndUpdate.mockReturnValue(queryResolving(product));

      await service.update(productId, updateDto);

      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        productId,
        updateDto,
        { returnDocument: 'after', runValidators: true },
      );
    });

    it('throws NotFoundException when the product does not exist', async () => {
      productModel.findByIdAndUpdate.mockReturnValue(queryResolving(null));

      await expect(service.update(productId, updateDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ConflictException on a duplicate key error', async () => {
      productModel.findByIdAndUpdate.mockReturnValue(
        queryRejecting(duplicateKeyError),
      );

      await expect(service.update(productId, updateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows any other error unchanged', async () => {
      const error = new Error('connection lost');
      productModel.findByIdAndUpdate.mockReturnValue(queryRejecting(error));

      await expect(service.update(productId, updateDto)).rejects.toBe(error);
    });
  });

  describe('remove', () => {
    it('returns the deleted product when found', async () => {
      productModel.findByIdAndDelete.mockReturnValue(queryResolving(product));

      await expect(service.remove(productId)).resolves.toBe(product);
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(productId);
    });

    it('throws NotFoundException when the product does not exist', async () => {
      productModel.findByIdAndDelete.mockReturnValue(queryResolving(null));

      await expect(service.remove(productId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
