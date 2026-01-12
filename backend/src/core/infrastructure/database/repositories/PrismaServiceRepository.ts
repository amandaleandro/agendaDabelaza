import { Injectable } from '@nestjs/common';
import { Service } from '../../../domain/entities/Service';
import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { PrismaService } from '../prisma/PrismaService';

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(service: Service): Promise<void> {
    await this.prisma.service.create({
      data: {
        id: service.id,
        establishmentId: service.establishmentId,
        professionalId: service.professionalId,
        name: service.name,
        description: service.description,
        price: service.price,
        durationMinutes: service.durationMinutes,
      },
    });
  }

  async findById(id: string): Promise<Service | null> {
    const row = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!row) return null;

    return Service.restore({
      id: row.id,
      establishmentId: row.establishmentId,
      professionalId: row.professionalId,
      name: row.name,
      description: row.description,
      price: row.price,
      durationMinutes: row.durationMinutes,
      createdAt: row.createdAt,
    });
  }

  async findAll(): Promise<Service[]> {
    const rows = await this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      Service.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        professionalId: row.professionalId,
        name: row.name,
        description: row.description,
        price: row.price,
        durationMinutes: row.durationMinutes,
        createdAt: row.createdAt,
      }),
    );
  }

  async findByProfessional(professionalId: string): Promise<Service[]> {
    const rows = await this.prisma.service.findMany({
      where: { professionalId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      Service.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        professionalId: row.professionalId,
        name: row.name,
        description: row.description,
        price: row.price,
        durationMinutes: row.durationMinutes,
        createdAt: row.createdAt,
      }),
    );
  }

  async update(service: Service): Promise<void> {
    await this.prisma.service.update({
      where: { id: service.id },
      data: {
        establishmentId: service.establishmentId,
        name: service.name,
        description: service.description,
        price: service.price,
        durationMinutes: service.durationMinutes,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.delete({
      where: { id },
    });
  }
}
