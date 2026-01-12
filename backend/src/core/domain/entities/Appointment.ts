// src/core/domain/entities/Appointment.ts

import { AppointmentStatus } from '../enums/AppointmentStatus';

export class Appointment {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly establishmentId: string,
    public readonly professionalId: string,
    public readonly serviceId: string,
    public readonly scheduledAt: Date,
    public readonly durationMinutes: number,
    public status: AppointmentStatus,
    public readonly price: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    userId: string;
    establishmentId: string;
    professionalId: string;
    serviceId: string;
    scheduledAt: Date;
    durationMinutes: number;
    price: number;
  }): Appointment {
    if (
      !props.id ||
      !props.userId ||
      !props.establishmentId ||
      !props.professionalId ||
      !props.serviceId
    ) {
      throw new Error('All IDs are required');
    }

    if (props.durationMinutes <= 0) {
      throw new Error('Appointment duration must be greater than zero');
    }

    if (props.price <= 0) {
      throw new Error('Appointment price must be greater than zero');
    }

    const now = new Date();
    // Permitir agendamentos até 2 minutos no passado (para compensar delay de rede/processamento)
    const minTime = new Date(now.getTime() - 2 * 60 * 1000);
    if (props.scheduledAt.getTime() < minTime.getTime()) {
      console.error('[Appointment] Validation failed:', {
        scheduledAt: props.scheduledAt.toISOString(),
        now: now.toISOString(),
        minTime: minTime.toISOString(),
        diff: props.scheduledAt.getTime() - now.getTime()
      });
      throw new Error('Appointment must be scheduled in the future');
    }

    return new Appointment(
      props.id,
      props.userId,
      props.establishmentId,
      props.professionalId,
      props.serviceId,
      props.scheduledAt,
      props.durationMinutes,
      AppointmentStatus.SCHEDULED,
      props.price,
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    userId: string;
    establishmentId: string;
    professionalId: string;
    serviceId: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: AppointmentStatus;
    price: number;
    createdAt: Date;
  }): Appointment {
    return new Appointment(
      props.id,
      props.userId,
      props.establishmentId,
      props.professionalId,
      props.serviceId,
      props.scheduledAt,
      props.durationMinutes,
      props.status,
      props.price,
      props.createdAt,
    );
  }

  cancel(): void {
    if (this.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Only scheduled appointments can be cancelled');
    }
    this.status = AppointmentStatus.CANCELLED;
  }

  cancelWithFee(now: Date, windowHours: number, feePercent: number): number {
    if (this.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Only scheduled appointments can be cancelled');
    }

    const diffMs = this.scheduledAt.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    this.status = AppointmentStatus.CANCELLED;

    if (diffHours >= windowHours) return 0;
    return (this.price * feePercent) / 100;
  }

  complete(): void {
    if (this.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Only scheduled appointments can be completed');
    }
    this.status = AppointmentStatus.COMPLETED;
  }

  markNoShow(): void {
    if (this.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Only scheduled appointments can be marked as no-show');
    }
    this.status = AppointmentStatus.NO_SHOW;
  }
}
