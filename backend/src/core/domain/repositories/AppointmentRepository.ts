import { Appointment } from '../entities/Appointment';

export interface AppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  update(appointment: Appointment): Promise<void>;
  findById(id: string): Promise<Appointment | null>;
  findAll(): Promise<Appointment[]>;
  findByUser(userId: string): Promise<Appointment[]>;
  existsAtSchedule(professionalId: string, scheduledAt: Date): Promise<boolean>;
  findScheduledBetween(
    professionalId: string,
    start: Date,
    end: Date,
  ): Promise<Appointment[]>;
}
