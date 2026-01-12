import {
  DayOfWeek,
  Schedule,
} from '../../../src/core/domain/entities/Schedule';
import { ScheduleRepository } from '../../../src/core/domain/repositories/ScheduleRepository';

export class FakeScheduleRepository implements ScheduleRepository {
  private schedules: Schedule[] = [];

  async save(schedule: Schedule): Promise<void> {
    this.schedules.push(schedule);
  }

  async findById(id: string): Promise<Schedule | null> {
    return this.schedules.find((schedule) => schedule.id === id) ?? null;
  }

  async findByProfessional(professionalId: string): Promise<Schedule[]> {
    return this.schedules.filter(
      (schedule) => schedule.professionalId === professionalId,
    );
  }

  async findByProfessionalAndDay(
    professionalId: string,
    dayOfWeek: DayOfWeek,
  ): Promise<Schedule | null> {
    return (
      this.schedules.find(
        (schedule) =>
          schedule.professionalId === professionalId &&
          schedule.dayOfWeek === dayOfWeek,
      ) ?? null
    );
  }

  async update(schedule: Schedule): Promise<void> {
    const index = this.schedules.findIndex((s) => s.id === schedule.id);
    if (index >= 0) {
      this.schedules[index] = schedule;
    }
  }

  async replaceForProfessional(
    professionalId: string,
    schedules: Schedule[],
  ): Promise<void> {
    this.schedules = this.schedules.filter(
      (s) => s.professionalId !== professionalId,
    );
    this.schedules.push(...schedules);
  }
}
