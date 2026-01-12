import { Injectable } from '@nestjs/common';
import { Product } from '../../../domain/entities/Product';
import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { PrismaService } from '../prisma/PrismaService';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(product: Product): Promise<void> {
    await this.prisma.product.create({
      data: {
        id: product.id,
        establishmentId: product.establishmentId,
        professionalId: product.professionalId,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
      },
    });
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!row) return null;

    return Product.restore({
      id: row.id,
      establishmentId: row.establishmentId,
      professionalId: row.professionalId,
      name: row.name,
      description: row.description,
      price: row.price,
      stock: row.stock,
      createdAt: row.createdAt,
    });
  }

  async findAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      Product.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        professionalId: row.professionalId,
        name: row.name,
        description: row.description,
        price: row.price,
        stock: row.stock,
        createdAt: row.createdAt,
      }),
    );
  }

  async findByProfessional(professionalId: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: { professionalId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      Product.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        professionalId: row.professionalId,
        name: row.name,
        description: row.description,
        price: row.price,
        stock: row.stock,
        createdAt: row.createdAt,
      }),
    );
  }

  async update(product: Product): Promise<void> {
    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        establishmentId: product.establishmentId,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
