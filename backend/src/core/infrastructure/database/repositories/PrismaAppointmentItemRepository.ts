import { Injectable } from '@nestjs/common';
import { AppointmentItem } from '../../../domain/entities/AppointmentItem';
import { AppointmentItemRepository } from '../../../domain/repositories/AppointmentItemRepository';
import { PrismaService } from '../prisma/PrismaService';

@Injectable()
export class PrismaAppointmentItemRepository implements AppointmentItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(item: AppointmentItem): Promise<void> {
    await this.prisma.appointmentItem.create({
      data: {
        id: item.id,
        appointmentId: item.appointmentId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      },
    });
  }

  async findById(id: string): Promise<AppointmentItem | null> {
    const row = await this.prisma.appointmentItem.findUnique({
      where: { id },
    });

    if (!row) return null;

    return AppointmentItem.restore({
      id: row.id,
      appointmentId: row.appointmentId,
      productId: row.productId,
      quantity: row.quantity,
      price: row.price,
      createdAt: row.createdAt,
    });
  }

  async findByAppointment(appointmentId: string): Promise<AppointmentItem[]> {
    const rows = await this.prisma.appointmentItem.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) =>
      AppointmentItem.restore({
        id: row.id,
        appointmentId: row.appointmentId,
        productId: row.productId,
        quantity: row.quantity,
        price: row.price,
        createdAt: row.createdAt,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointmentItem.delete({
      where: { id },
    });
  }
}
