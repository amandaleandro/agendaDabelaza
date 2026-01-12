import { Injectable } from '@nestjs/common';
import { Owner } from '../../domain/entities/Owner';
import { OwnerRepository } from '../../domain/repositories/OwnerRepository';
import { PrismaService } from '../database/prisma/PrismaService';

@Injectable()
export class PrismaOwnerRepository implements OwnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(owner: Owner): Promise<void> {
    await this.prisma.owner.create({
      data: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        password: owner.password,
        googleId: owner.googleId,
        phone: owner.phone,
        createdAt: owner.createdAt,
      },
    });
  }

  async findByEmail(email: string): Promise<Owner | null> {
    const data = await this.prisma.owner.findUnique({
      where: { email },
    });

    if (!data) return null;

    return new Owner(
      data.id,
      data.name,
      data.email,
      data.password,
      data.googleId,
      data.phone,
      data.createdAt,
    );
  }

  async findById(id: string): Promise<Owner | null> {
    const data = await this.prisma.owner.findUnique({
      where: { id },
    });

    if (!data) return null;

    return new Owner(
      data.id,
      data.name,
      data.email,
      data.password,
      data.googleId,
      data.phone,
      data.createdAt,
    );
  }
}
