import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsController } from './products.controller.js';
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

describe('ProductsController', () => {
  let controller: ProductsController;

  const productsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    controller = moduleRef.get(ProductsController);
  });

  describe('create', () => {
    it('passes the DTO to the service and returns the created product', async () => {
      productsService.create.mockResolvedValue(product);

      await expect(controller.create(createDto)).resolves.toBe(product);
      expect(productsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('returns the list from the service', async () => {
      productsService.findAll.mockResolvedValue([product]);

      await expect(controller.findAll()).resolves.toEqual([product]);
    });
  });

  describe('findById', () => {
    it('looks the product up by id and returns it', async () => {
      productsService.findOne.mockResolvedValue(product);

      await expect(controller.findById({ id: productId })).resolves.toBe(
        product,
      );
      expect(productsService.findOne).toHaveBeenCalledWith(productId);
    });

    it('lets NotFoundException from the service propagate', async () => {
      productsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findById({ id: productId }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('passes the id and DTO to the service and returns the updated product', async () => {
      const dto: UpdateProductDto = { unitPrice: 1500 };
      productsService.update.mockResolvedValue(product);

      await expect(controller.update({ id: productId }, dto)).resolves.toBe(
        product,
      );
      expect(productsService.update).toHaveBeenCalledWith(productId, dto);
    });
  });

  describe('remove', () => {
    it('passes the id to the service', async () => {
      productsService.remove.mockResolvedValue(product);

      await controller.remove({ id: productId });

      expect(productsService.remove).toHaveBeenCalledWith(productId);
    });
  });
});
