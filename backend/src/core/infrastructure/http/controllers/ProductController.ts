import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateProductUseCase } from '../../../application/products/CreateProductUseCase';
import { ListProductsByProfessionalUseCase } from '../../../application/products/ListProductsByProfessionalUseCase';
import { AddProductToAppointmentUseCase } from '../../../application/appointments/AddProductToAppointmentUseCase';
import {
  CreateProductDto,
  AddProductToAppointmentDto,
} from '../dtos/ProductDto';
import { PrismaProductRepository } from '../../database/repositories/PrismaProductRepository';

@Controller('products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsByProfessionalUseCase,
    private readonly addProductToAppointmentUseCase: AddProductToAppointmentUseCase,
    private readonly productRepository: PrismaProductRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateProductDto,
    @Query('professionalId') professionalId?: string,
  ) {
    const resolvedProfessionalId = dto.professionalId || professionalId;

    if (!resolvedProfessionalId) {
      throw new BadRequestException('professionalId is required');
    }

    const product = await this.createProductUseCase.execute({
      id: randomUUID(),
      professionalId: resolvedProfessionalId,
      establishmentId: dto.establishmentId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
    });

    return {
      id: product.id,
      professionalId: product.professionalId,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      createdAt: product.createdAt.toISOString(),
    };
  }

  @Get()
  async list(@Query('professionalId') professionalId?: string) {
    const products = professionalId
      ? await this.listProductsUseCase.execute(professionalId)
      : await this.productRepository.findAll();

    return products.map((product) => ({
      id: product.id,
      establishmentId: product.establishmentId,
      professionalId: product.professionalId,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      createdAt: product.createdAt.toISOString(),
    }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) return null;

    return {
      id: product.id,
      establishmentId: product.establishmentId,
      professionalId: product.professionalId,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      createdAt: product.createdAt.toISOString(),
    };
  }

  @Post('appointments/:appointmentId/items')
  @HttpCode(HttpStatus.CREATED)
  async addProductToAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: AddProductToAppointmentDto,
  ) {
    const item = await this.addProductToAppointmentUseCase.execute({
      id: randomUUID(),
      appointmentId,
      productId: dto.productId,
      quantity: dto.quantity,
    });

    return {
      id: item.id,
      appointmentId: item.appointmentId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.getTotalPrice(),
      createdAt: item.createdAt.toISOString(),
    };
  }
}
