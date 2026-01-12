import * as Appointment from '../../../src/core/domain/entities/Appointment';
import * as AppointmentRepository from '../../../src/core/domain/repositories/AppointmentRepository';
import { AppointmentStatus } from '../../../src/core/domain/enums/AppointmentStatus';

export class FakeAppointmentRepository
  implements AppointmentRepository.AppointmentRepository
{
  private appointments: Appointment.Appointment[] = [];

  async save(appointment: Appointment.Appointment): Promise<void> {
    this.appointments.push(appointment);
  }

  async update(appointment: Appointment.Appointment): Promise<void> {
    const index = this.appointments.findIndex((a) => a.id === appointment.id);
    if (index >= 0) {
      this.appointments[index] = appointment;
    }
  }

  async findById(id: string): Promise<Appointment.Appointment | null> {
    return this.appointments.find((a) => a.id === id) ?? null;
  }

  async existsAtSchedule(
    professionalId: string,
    scheduledAt: Date,
  ): Promise<boolean> {
    return this.appointments.some(
      (appointment) =>
        appointment.professionalId === professionalId &&
        appointment.scheduledAt.getTime() === scheduledAt.getTime(),
    );
  }

  async findScheduledBetween(
    professionalId: string,
    start: Date,
    end: Date,
  ): Promise<Appointment.Appointment[]> {
    return this.appointments.filter(
      (appointment) =>
        appointment.professionalId === professionalId &&
        appointment.status === AppointmentStatus.SCHEDULED &&
        appointment.scheduledAt >= start &&
        appointment.scheduledAt < end,
    );
  }

  async findAll(): Promise<Appointment.Appointment[]> {
    return this.appointments;
  }

  async findByUser(userId: string): Promise<Appointment.Appointment[]> {
    return this.appointments.filter((a) => a.userId === userId);
  }

  // helper só pra teste
  getAll() {
    return this.appointments;
  }
}
