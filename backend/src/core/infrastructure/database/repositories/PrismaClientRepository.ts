import { Injectable } from '@nestjs/common';
import { Client } from '../../../domain/entities/Client';
import { ClientRepository } from '../../../domain/repositories/ClientRepository';
import { PrismaService } from '../prisma/PrismaService';

@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(client: Client): Promise<void> {
    await this.prisma.client.create({
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        blocked: client.blocked,
      },
    });
  }

  async findById(id: string): Promise<Client | null> {
    const row = await this.prisma.client.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const row = await this.prisma.client.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Client[]> {
    const rows = await this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async updatePartial(id: string, data: Partial<Client>): Promise<Client> {
    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        blocked: data.blocked,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    name: string;
    email: string;
    phone: string;
    blocked: boolean;
    createdAt: Date;
  }): Client {
    return Client.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      blocked: row.blocked,
      createdAt: row.createdAt,
    });
  }
}
