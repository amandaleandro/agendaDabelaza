import { describe, it, expect } from '@jest/globals';
import { CreateAppointmentUseCase } from '../../src/core/application/appointments/CreateAppointmentUseCase';
import { FakeAppointmentRepository } from './fakes/FakeAppointmentRepository';
import { FakeServiceRepository } from './fakes/FakeServiceRepository';
import { FakeScheduleRepository } from './fakes/FakeScheduleRepository';
import { Service } from '../../src/core/domain/entities/Service';
import { DayOfWeek, Schedule } from '../../src/core/domain/entities/Schedule';

const getDayOfWeek = (date: Date): DayOfWeek =>
  [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ][date.getDay()];

const tomorrowAt = (hours: number, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

describe('CreateAppointmentUseCase', () => {
  it('should create an appointment successfully', async () => {
    const appointmentRepository = new FakeAppointmentRepository();
    const serviceRepository = new FakeServiceRepository();
    const scheduleRepository = new FakeScheduleRepository();
    const useCase = new CreateAppointmentUseCase(
      appointmentRepository,
      serviceRepository,
      scheduleRepository,
    );

    const scheduledAt = tomorrowAt(10, 0);
    const dayOfWeek = getDayOfWeek(scheduledAt);

    const service = Service.create({
      id: 'service-1',
      establishmentId: 'est-1',
      professionalId: 'prof-1',
      name: 'Haircut',
      description: 'Standard cut',
      price: 120,
      durationMinutes: 60,
    });
    await serviceRepository.save(service);

    const schedule = Schedule.create({
      id: 'schedule-1',
      establishmentId: 'est-1',
      professionalId: 'prof-1',
      dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
    });
    await scheduleRepository.save(schedule);

    const appointment = await useCase.execute({
      id: 'appt-1',
      userId: 'user-1',
      establishmentId: 'est-1',
      professionalId: 'prof-1',
      serviceId: 'service-1',
      scheduledAt,
    });

    expect(appointment.price).toBe(service.price);
    expect(appointment.durationMinutes).toBe(service.durationMinutes);
    expect(appointmentRepository.getAll()).toHaveLength(1);
  });

  it('should not allow creating appointment if time is unavailable', async () => {
    const appointmentRepository = new FakeAppointmentRepository();
    const serviceRepository = new FakeServiceRepository();
    const scheduleRepository = new FakeScheduleRepository();
    const useCase = new CreateAppointmentUseCase(
      appointmentRepository,
      serviceRepository,
      scheduleRepository,
    );

    const scheduledAt = tomorrowAt(10, 0);
    const dayOfWeek = getDayOfWeek(scheduledAt);

    const service = Service.create({
      id: 'service-1',
      establishmentId: 'est-1',
      professionalId: 'prof-1',
      name: 'Haircut',
      description: 'Standard cut',
      price: 120,
      durationMinutes: 60,
    });
    await serviceRepository.save(service);

    const schedule = Schedule.create({
      id: 'schedule-1',
      establishmentId: 'est-1',
      professionalId: 'prof-1',
      dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
    });
    await scheduleRepository.save(schedule);

    await useCase.execute({
      id: 'appt-1',
      userId: 'user-1',
      establishmentId: 'est-1',
      professionalId: 'prof-1',
      serviceId: 'service-1',
      scheduledAt,
    });

    await expect(
      useCase.execute({
        id: 'appt-2',
        userId: 'user-2',
        establishmentId: 'est-1',
        professionalId: 'prof-1',
        serviceId: 'service-1',
        scheduledAt: tomorrowAt(10, 30),
      }),
    ).rejects.toThrow('Professional is not available at this time');
  });
});
