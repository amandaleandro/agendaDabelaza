import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { DayOfWeek } from '../../domain/entities/Schedule';
import { NotificationGateway } from '../../domain/gateways/NotificationGateway';

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

    // Buscar todos os horários do profissional e validar contra qualquer faixa disponível no dia
    const allSchedules = await this.scheduleRepository.findByProfessional(
      input.professionalId,
    );
    const dayOfWeek = this.getDayOfWeek(input.scheduledAt);
    const daySchedules = allSchedules.filter(
      (s) => s.dayOfWeek === dayOfWeek && s.isAvailable,
    );

    if (daySchedules.length === 0) {
      throw new Error('Professional has no availability for this day');
    }

    const appointmentStart = input.scheduledAt;
    const appointmentEnd = new Date(
      appointmentStart.getTime() + service.durationMinutes * 60 * 1000,
    );

    // Debug: log faixas de agenda e janela do agendamento
    try {
      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const aptStartMin = appointmentStart.getHours() * 60 + appointmentStart.getMinutes();
      const aptEndMin = appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes();
      const ranges = daySchedules.map((s) => ({
        start: s.startTime,
        end: s.endTime,
        startMin: toMinutes(s.startTime),
        endMin: toMinutes(s.endTime),
      }));
      console.debug('[CreateAppointmentUseCase] Schedules', {
        professionalId: input.professionalId,
        dayOfWeek,
        ranges,
        aptStart: appointmentStart.toISOString(),
        aptEnd: appointmentEnd.toISOString(),
        aptStartMin,
        aptEndMin,
      });
    } catch {}

    // O agendamento deve caber completamente dentro de pelo menos uma faixa do dia
    const fitsInSomeSchedule = daySchedules.some((s) =>
      this.isWithinSchedule(
        s.startTime,
        s.endTime,
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

    const overlaps = existing.some((a) =>
      this.overlaps(
        appointmentStart,
        appointmentEnd,
        a.scheduledAt,
        new Date(a.scheduledAt.getTime() + a.durationMinutes * 60 * 1000),
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

    // Enviar notificações de confirmação
    if (this.notificationGateway && input.clientEmail && input.clientName) {
      try {
        const notificationData = {
          appointmentId: appointment.id,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone,
          establishmentName: input.establishmentName || 'Estabelecimento',
          serviceName: service.name,
          professionalName: input.professionalName || 'Profissional',
          scheduledAt: appointment.scheduledAt,
          price: appointment.price,
          durationMinutes: appointment.durationMinutes,
        };

        // Enviar email
        await this.notificationGateway.sendAppointmentConfirmationEmail(
          notificationData,
        );

        // Enviar WhatsApp se telefone disponível
        if (input.clientPhone) {
          await this.notificationGateway.sendAppointmentConfirmationWhatsApp(
            notificationData,
          );
        }
      } catch (error) {
        console.error('Error sending notifications:', error);
        // Não falhar o agendamento se notificação falhar
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
    aptStart: Date,
    aptEnd: Date,
  ): boolean {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    const aptStartMin = aptStart.getHours() * 60 + aptStart.getMinutes();
    const aptEndMin = aptEnd.getHours() * 60 + aptEnd.getMinutes();
    return aptStartMin >= startMin && aptEndMin <= endMin;
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
