import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaProductRepository } from '../core/infrastructure/database/repositories/PrismaProductRepository';
import { PrismaAppointmentItemRepository } from '../core/infrastructure/database/repositories/PrismaAppointmentItemRepository';
import { CreateProductUseCase } from '../core/application/products/CreateProductUseCase';
import { ListProductsByProfessionalUseCase } from '../core/application/products/ListProductsByProfessionalUseCase';
import { AddProductToAppointmentUseCase } from '../core/application/appointments/AddProductToAppointmentUseCase';
import { ProductController } from '../core/infrastructure/http/controllers/ProductController';

@Module({
  controllers: [ProductController],
  providers: [
    PrismaService,
    {
      provide: PrismaProductRepository,
      useFactory: (prisma: PrismaService) => new PrismaProductRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaAppointmentItemRepository,
      useFactory: (prisma: PrismaService) => new PrismaAppointmentItemRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateProductUseCase,
      useFactory: (productRepo) => new CreateProductUseCase(productRepo),
      inject: [PrismaProductRepository],
    },
    {
      provide: ListProductsByProfessionalUseCase,
      useFactory: (productRepo) =>
        new ListProductsByProfessionalUseCase(productRepo),
      inject: [PrismaProductRepository],
    },
    {
      provide: AddProductToAppointmentUseCase,
      useFactory: (itemRepo, productRepo) =>
        new AddProductToAppointmentUseCase(itemRepo, productRepo),
      inject: [PrismaAppointmentItemRepository, PrismaProductRepository],
    },
  ],
  exports: [
    CreateProductUseCase,
    ListProductsByProfessionalUseCase,
    AddProductToAppointmentUseCase,
  ],
})
export class ProductModule {}
