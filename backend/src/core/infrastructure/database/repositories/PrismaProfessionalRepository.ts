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
        password: professional.password,
        freelancer: professional.freelancer,
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
      freelancer: row.freelancer,
      createdAt: row.createdAt,
      password: row.password,
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
        freelancer: row.freelancer,
        createdAt: row.createdAt,
        password: row.password,
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
        freelancer: row.freelancer,
        createdAt: row.createdAt,
        password: row.password,
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
        password: professional.password,
        freelancer: professional.freelancer,
      },
    });
  }

  async findByEmail(email: string): Promise<Professional[]> {
    const rows = await this.prisma.professional.findMany({
      where: { email },
    });

    return rows.map((row) =>
      Professional.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        freelancer: row.freelancer,
        createdAt: row.createdAt,
        password: row.password,
      }),
    );
  }

  async findOneByEmail(email: string): Promise<Professional | null> {
    const row = await this.prisma.professional.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    return row ? this.toDomain(row) : null;
  }

  async updatePartial(
    id: string,
    data: Partial<Professional> & { password?: string | null },
  ): Promise<Professional> {
    const updated = await this.prisma.professional.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        freelancer: data.freelancer,
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
    password: string | null;
    freelancer: boolean;
    createdAt: Date;
  }): Professional {
    return Professional.restore({
      id: row.id,
      establishmentId: row.establishmentId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      freelancer: row.freelancer,
      createdAt: row.createdAt,
      password: row.password,
    });
  }
}
