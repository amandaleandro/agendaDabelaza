import { AppointmentRepository } from '../../../domain/repositories/AppointmentRepository';
import { PrismaService } from '../prisma/PrismaService';
import { Appointment } from '../../../domain/entities/Appointment';
import { AppointmentStatus } from 'src/core/domain/enums/AppointmentStatus';

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Appointment | null> {
    const data = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!data) return null;

    return Appointment.restore({
      id: data.id,
      userId: data.userId,
      establishmentId: data.establishmentId,
      professionalId: data.professionalId,
      serviceId: data.serviceId,
      scheduledAt: data.scheduledAt,
      status: data.status as AppointmentStatus,
      price: data.price,
      createdAt: data.createdAt,
      durationMinutes: data.durationMinutes,
    });
  }

  async save(appointment: Appointment): Promise<void> {
    await this.prisma.appointment.create({
      data: {
        id: appointment.id,
        userId: appointment.userId,
        establishmentId: appointment.establishmentId,
        professionalId: appointment.professionalId,
        serviceId: appointment.serviceId,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        price: appointment.price,
        createdAt: appointment.createdAt,
        durationMinutes: appointment.durationMinutes,
      },
    });
  }

  async findAll(): Promise<Appointment[]> {
    try {
      const rows = await this.prisma.appointment.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return rows.map((data) =>
        Appointment.restore({
          id: data.id,
          userId: data.userId,
          establishmentId: data.establishmentId,
          professionalId: data.professionalId,
          serviceId: data.serviceId,
          scheduledAt: data.scheduledAt,
          status: data.status as AppointmentStatus,
          price: data.price,
          createdAt: data.createdAt,
          durationMinutes: data.durationMinutes ?? 0,
        }),
      );
    } catch (error) {
      console.error('Error in findAll:', error);
      return [];
    }
  }

  async findByUser(userId: string): Promise<Appointment[]> {
    const rows = await this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
    });

    return rows.map((data) =>
      Appointment.restore({
        id: data.id,
        userId: data.userId,
        establishmentId: data.establishmentId,
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        scheduledAt: data.scheduledAt,
        status: data.status as AppointmentStatus,
        price: data.price,
        createdAt: data.createdAt,
        durationMinutes: data.durationMinutes ?? 0,
      }),
    );
  }

  async update(appointment: Appointment): Promise<void> {
    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: appointment.status,
      },
    });
  }

  async existsAtSchedule(
    professionalId: string,
    scheduledAt: Date,
  ): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: {
        professionalId,
        scheduledAt,
        status: 'SCHEDULED',
      },
    });

    return count > 0;
  }

  async findScheduledBetween(
    professionalId: string,
    start: Date,
    end: Date,
  ): Promise<Appointment[]> {
    const rows = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        status: 'SCHEDULED',
        scheduledAt: {
          gte: start,
          lt: end,
        },
      },
      include: {
        service: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return rows.map((data) =>
      Appointment.restore({
        id: data.id,
        userId: data.userId,
        establishmentId: data.establishmentId,
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        scheduledAt: data.scheduledAt,
        status: data.status as AppointmentStatus,
        price: data.price,
        createdAt: data.createdAt,
        durationMinutes: data.service?.durationMinutes ?? 0,
      }),
    );
  }
}
