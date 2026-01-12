import { DayOfWeek, Schedule } from '../entities/Schedule';

export interface ScheduleRepository {
  save(schedule: Schedule): Promise<void>;
  replaceForProfessional(
    professionalId: string,
    schedules: Schedule[],
  ): Promise<void>;
  findById(id: string): Promise<Schedule | null>;
  findByProfessional(professionalId: string): Promise<Schedule[]>;
  findByProfessionalAndDay(
    professionalId: string,
    dayOfWeek: DayOfWeek,
  ): Promise<Schedule | null>;
  update(schedule: Schedule): Promise<void>;
}
