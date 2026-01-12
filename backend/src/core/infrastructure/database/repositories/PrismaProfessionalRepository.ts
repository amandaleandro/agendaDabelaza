import { Injectable } from '@nestjs/common';
import { Professional } from '../../../domain/entities/Professional';
import { ProfessionalRepository } from '../../../domain/repositories/ProfessionalRepository';
import { PrismaService } from '../prisma/PrismaService';

@Injectable()
export class PrismaProfessionalRepository implements ProfessionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(professional: Professional): Promise<void> {
    await this.prisma.professional.create({
      data: {
        id: professional.id,
        establishmentId: professional.establishmentId,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        stripeAccountId: professional.stripeAccountId,
      },
    });
  }

  async findById(id: string): Promise<Professional | null> {
    const row = await this.prisma.professional.findUnique({
      where: { id },
    });

    if (!row) return null;

    return Professional.restore({
      id: row.id,
      establishmentId: row.establishmentId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      stripeAccountId: row.stripeAccountId,
      createdAt: row.createdAt,
    });
  }

  async findByEstablishment(establishmentId: string): Promise<Professional[]> {
    const rows = await this.prisma.professional.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      Professional.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        stripeAccountId: row.stripeAccountId,
        createdAt: row.createdAt,
      }),
    );
  }

  async findAll(): Promise<Professional[]> {
    const rows = await this.prisma.professional.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      Professional.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        stripeAccountId: row.stripeAccountId,
        createdAt: row.createdAt,
      }),
    );
  }

  async update(professional: Professional): Promise<void> {
    await this.prisma.professional.update({
      where: { id: professional.id },
      data: {
        establishmentId: professional.establishmentId,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        stripeAccountId: professional.stripeAccountId,
      },
    });
  }

  async updatePartial(id: string, data: Partial<Professional>): Promise<Professional> {
    const updated = await this.prisma.professional.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.professional.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    establishmentId: string;
    name: string;
    email: string;
    phone: string;
    stripeAccountId: string | null;
    createdAt: Date;
  }): Professional {
    return Professional.restore({
      id: row.id,
      establishmentId: row.establishmentId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      stripeAccountId: row.stripeAccountId,
      createdAt: row.createdAt,
    });
  }
}
