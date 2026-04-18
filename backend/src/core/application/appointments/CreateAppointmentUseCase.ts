import { Appointment } from '../../domain/entities/Appointment';
import { DayOfWeek } from '../../domain/entities/Schedule';
import { NotificationGateway } from '../../domain/gateways/NotificationGateway';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';

type CreateAppointmentInput = {
  id: string;
  userId: string;
  establishmentId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: Date;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  professionalName?: string;
  establishmentName?: string;
};

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly notificationGateway?: NotificationGateway,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    const service = await this.serviceRepository.findById(input.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    if (
      service.professionalId !== input.professionalId ||
      service.establishmentId !== input.establishmentId
    ) {
      throw new Error(
        'Service does not belong to this professional or establishment',
      );
    }

    const allSchedules = await this.scheduleRepository.findByProfessional(
      input.professionalId,
    );
    const dayOfWeek = this.getDayOfWeek(input.scheduledAt);
    const daySchedules = allSchedules.filter(
      (schedule) => schedule.dayOfWeek === dayOfWeek && schedule.isAvailable,
    );

    if (!daySchedules.length) {
      throw new Error('Professional has no availability for this day');
    }

    const appointmentStart = input.scheduledAt;
    const appointmentEnd = new Date(
      appointmentStart.getTime() + service.durationMinutes * 60 * 1000,
    );

    const fitsInSomeSchedule = daySchedules.some((schedule) =>
      this.isWithinSchedule(
        schedule.startTime,
        schedule.endTime,
        appointmentStart,
        appointmentEnd,
      ),
    );

    if (!fitsInSomeSchedule) {
      throw new Error('Appointment outside professional schedule');
    }

    const dayStart = new Date(appointmentStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await this.appointmentRepository.findScheduledBetween(
      input.professionalId,
      dayStart,
      dayEnd,
    );

    const overlaps = existing.some((appointment) =>
      this.overlaps(
        appointmentStart,
        appointmentEnd,
        appointment.scheduledAt,
        new Date(
          appointment.scheduledAt.getTime() +
            appointment.durationMinutes * 60 * 1000,
        ),
      ),
    );

    if (overlaps) {
      throw new Error('Professional is not available at this time');
    }

    const appointment = Appointment.create({
      id: input.id,
      userId: input.userId,
      establishmentId: input.establishmentId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      scheduledAt: input.scheduledAt,
      durationMinutes: service.durationMinutes,
      price: service.price,
    });

    await this.appointmentRepository.save(appointment);

    if (this.notificationGateway && input.clientName) {
      try {
        const notificationData = {
          appointmentId: appointment.id,
          clientName: input.clientName,
          clientEmail: input.clientEmail || '',
          clientPhone: input.clientPhone,
          establishmentName: input.establishmentName || 'Estabelecimento',
          serviceName: service.name,
          professionalName: input.professionalName || 'Profissional',
          scheduledAt: appointment.scheduledAt,
          price: appointment.price,
          durationMinutes: appointment.durationMinutes,
        };

        if (input.clientEmail) {
          await this.notificationGateway.sendAppointmentConfirmationEmail(
            notificationData,
          );
        }

        if (input.clientPhone) {
          await this.notificationGateway.sendAppointmentConfirmationWhatsApp(
            notificationData,
          );
          await this.notificationGateway.scheduleAppointmentReminders?.(
            notificationData,
          );
        }
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }

    return appointment;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const day = date.getDay();
    return [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ][day];
  }

  private isWithinSchedule(
    start: string,
    end: string,
    appointmentStart: Date,
    appointmentEnd: Date,
  ): boolean {
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    const appointmentStartMinutes =
      appointmentStart.getHours() * 60 + appointmentStart.getMinutes();
    const appointmentEndMinutes =
      appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes();

    return (
      appointmentStartMinutes >= startMinutes &&
      appointmentEndMinutes <= endMinutes
    );
  }

  private overlaps(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && aEnd > bStart;
  }
}
