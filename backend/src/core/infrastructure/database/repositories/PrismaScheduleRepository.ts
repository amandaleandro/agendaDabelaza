import { Injectable } from '@nestjs/common';
import { DayOfWeek, Schedule } from '../../../domain/entities/Schedule';
import { ScheduleRepository } from '../../../domain/repositories/ScheduleRepository';
import { PrismaService } from '../prisma/PrismaService';

@Injectable()
export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(schedule: Schedule): Promise<void> {
    await this.prisma.schedule.create({
      data: {
        id: schedule.id,
        establishmentId: schedule.establishmentId,
        professionalId: schedule.professionalId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: schedule.isAvailable,
      },
    });
  }

  async replaceForProfessional(
    professionalId: string,
    schedules: Schedule[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.schedule.deleteMany({ where: { professionalId } }),
      this.prisma.schedule.createMany({
        data: schedules.map((schedule) => ({
          id: schedule.id,
          establishmentId: schedule.establishmentId,
          professionalId: schedule.professionalId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isAvailable: schedule.isAvailable,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  async findById(id: string): Promise<Schedule | null> {
    const row = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!row) return null;

    return Schedule.restore({
      id: row.id,
      establishmentId: row.establishmentId,
      professionalId: row.professionalId,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      isAvailable: row.isAvailable,
      createdAt: row.createdAt,
    });
  }

  async findByProfessional(professionalId: string): Promise<Schedule[]> {
    const rows = await this.prisma.schedule.findMany({
      where: { professionalId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return rows.map((row) =>
      Schedule.restore({
        id: row.id,
        establishmentId: row.establishmentId,
        professionalId: row.professionalId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        isAvailable: row.isAvailable,
        createdAt: row.createdAt,
      }),
    );
  }

  async findByProfessionalAndDay(
    professionalId: string,
    dayOfWeek: DayOfWeek,
  ): Promise<Schedule | null> {
    const row = await this.prisma.schedule.findFirst({
      where: { professionalId, dayOfWeek },
      orderBy: { startTime: 'asc' },
    });

    if (!row) return null;

    return Schedule.restore({
      id: row.id,
      establishmentId: row.establishmentId,
      professionalId: row.professionalId,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      isAvailable: row.isAvailable,
      createdAt: row.createdAt,
    });
  }

  async update(schedule: Schedule): Promise<void> {
    await this.prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: schedule.isAvailable,
      },
    });
  }
}
