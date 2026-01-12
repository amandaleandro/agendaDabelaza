import { Injectable } from '@nestjs/common';
import { Establishment } from '../../domain/entities/Establishment';
import { EstablishmentRepository } from '../../domain/repositories/EstablishmentRepository';
import { PrismaService } from '../database/prisma/PrismaService';

@Injectable()
export class PrismaEstablishmentRepository implements EstablishmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(establishment: Establishment): Promise<void> {
    await this.prisma.establishment.create({
      data: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
        ownerId: establishment.ownerId,
        primaryColor: establishment.primaryColor,
        secondaryColor: establishment.secondaryColor,
        bio: establishment.bio,
        logoUrl: establishment.logoUrl,
        bannerUrl: establishment.bannerUrl,
        phone: establishment.phone,
        cnpj: establishment.cnpj,
        address: establishment.address,
        createdAt: establishment.createdAt,
      },
    });
  }

  async findBySlug(slug: string): Promise<Establishment | null> {
    const data = await this.prisma.establishment.findUnique({
      where: { slug },
    });

    if (!data) return null;

    return new Establishment(
      data.id,
      data.name,
      data.slug,
      data.ownerId,
      data.primaryColor,
      data.secondaryColor,
      data.phone,
      data.bio,
      data.logoUrl,
      data.bannerUrl,
      data.cnpj,
      data.address,
      data.createdAt,
    );
  }

  async findByOwnerId(ownerId: string): Promise<Establishment | null> {
    const data = await this.prisma.establishment.findFirst({
      where: { ownerId },
    });

    if (!data) return null;

    return new Establishment(
      data.id,
      data.name,
      data.slug,
      data.ownerId,
      data.primaryColor,
      data.secondaryColor,
      data.phone,
      data.bio,
      data.logoUrl,
      data.bannerUrl,
      data.cnpj,
      data.address,
      data.createdAt,
    );
  }

  async findAll(): Promise<Establishment[]> {
    const data = await this.prisma.establishment.findMany();

    return data.map(
      (item) =>
        new Establishment(
          item.id,
          item.name,
          item.slug,
          item.ownerId,
          item.primaryColor,
          item.secondaryColor,
          item.phone,
          item.bio,
          item.logoUrl,
          item.bannerUrl,
          item.cnpj,
          item.address,
          item.createdAt,
        ),
    );
  }
}
