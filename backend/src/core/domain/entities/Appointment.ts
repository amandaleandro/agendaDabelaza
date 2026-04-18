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
    public holdExpiresAt: Date | null,
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
      null,
      props.durationMinutes,
      AppointmentStatus.SCHEDULED,
      props.price,
      new Date(),
    );
  }

  static createPendingPayment(props: {
    id: string;
    userId: string;
    establishmentId: string;
    professionalId: string;
    serviceId: string;
    scheduledAt: Date;
    durationMinutes: number;
    price: number;
    holdExpiresAt: Date;
  }): Appointment {
    const appointment = Appointment.create(props);
    appointment.status = AppointmentStatus.PAYMENT_PENDING;
    appointment.holdExpiresAt = props.holdExpiresAt;
    return appointment;
  }

  static restore(props: {
    id: string;
    userId: string;
    establishmentId: string;
    professionalId: string;
    serviceId: string;
    scheduledAt: Date;
    holdExpiresAt: Date | null;
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
      props.holdExpiresAt,
      props.durationMinutes,
      props.status,
      props.price,
      props.createdAt,
    );
  }

  cancel(): void {
    if (
      this.status !== AppointmentStatus.SCHEDULED &&
      this.status !== AppointmentStatus.PAYMENT_PENDING
    ) {
      throw new Error('Only active appointments can be cancelled');
    }
    this.status = AppointmentStatus.CANCELLED;
    this.holdExpiresAt = null;
  }

  cancelWithFee(now: Date, windowHours: number, feePercent: number): number {
    if (
      this.status !== AppointmentStatus.SCHEDULED &&
      this.status !== AppointmentStatus.PAYMENT_PENDING
    ) {
      throw new Error('Only active appointments can be cancelled');
    }

    if (this.status === AppointmentStatus.PAYMENT_PENDING) {
      this.status = AppointmentStatus.CANCELLED;
      this.holdExpiresAt = null;
      return 0;
    }

    const diffMs = this.scheduledAt.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    this.status = AppointmentStatus.CANCELLED;
    this.holdExpiresAt = null;

    if (diffHours >= windowHours) return 0;
    return (this.price * feePercent) / 100;
  }

  confirmPayment(): void {
    if (this.status !== AppointmentStatus.PAYMENT_PENDING) {
      throw new Error('Only payment pending appointments can be confirmed');
    }

    this.status = AppointmentStatus.SCHEDULED;
    this.holdExpiresAt = null;
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
