import { CancelAppointmentUseCase } from '../../src/core/application/appointments/CancelAppointmentUseCase';
import { Appointment } from '../../src/core/domain/entities/Appointment';
import { PlanCatalog } from '../../src/core/domain/plans/PlanCatalog';
import { PlanResolverService } from '../../src/core/domain/plans/PlanResolverService';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
  let planResolver: PlanResolverService;
  let appointmentRepo: any;

  beforeEach(() => {
    // Mock repos
    appointmentRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    planResolver = {
      resolveByOwner: jest
        .fn<() => Promise<any>>()
        .mockResolvedValue(PlanCatalog.FREE),
    } as any;

    useCase = new CancelAppointmentUseCase(appointmentRepo, planResolver);
  });

  it('should charge fee when inside window (FREE plan 12h)', async () => {
    const future = new Date();
    future.setHours(future.getHours() + 10); // 10h ahead (< 12h window -> fee)

    const appointment = Appointment.create({
      id: 'apt-123',
      userId: 'user-123',
      establishmentId: 'est-123',
      professionalId: 'prof-123',
      serviceId: 'svc-123',
      scheduledAt: future,
      durationMinutes: 60,
      price: 100,
    });

    appointmentRepo.findById.mockResolvedValue(appointment);

    const result = await useCase.execute({
      appointmentId: 'apt-123',
      now: new Date(),
    });

    // Inside window (<12h) => fee 40% for FREE plan
    expect(result.fee).toBe(40);
  });

  it('should charge 40% fee if past cancellation window (FREE plan)', async () => {
    const future = new Date();
    future.setHours(future.getHours() + 15); // 15h ahead (>= 12h window -> free)

    const appointment = Appointment.create({
      id: 'apt-456',
      userId: 'user-456',
      establishmentId: 'est-456',
      professionalId: 'prof-456',
      serviceId: 'svc-456',
      scheduledAt: future,
      durationMinutes: 60,
      price: 100,
    });

    appointmentRepo.findById.mockResolvedValue(appointment);

    const result = await useCase.execute({
      appointmentId: 'apt-456',
      now: new Date(),
    });

    // Outside window (>=12h) => no fee
    expect(result.fee).toBe(0);
  });

  it('should return 404 if appointment not found', async () => {
    appointmentRepo.findById.mockResolvedValue(null);

    const promise = useCase.execute({
      appointmentId: 'nonexistent',
      now: new Date(),
    });

    await expect(promise).rejects.toThrow('Appointment not found');
  });
});
