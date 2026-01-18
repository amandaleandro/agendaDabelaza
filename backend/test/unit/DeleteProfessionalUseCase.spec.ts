import { describe, it, expect } from '@jest/globals';
import { DeleteProfessionalUseCase } from '../../src/core/application/professionals/DeleteProfessionalUseCase';
import { FakeProfessionalRepository } from './fakes/FakeProfessionalRepository';
import { FakeScheduleRepository } from './fakes/FakeScheduleRepository';
import { Professional } from '../../src/core/domain/entities/Professional';
import { Schedule, DayOfWeek } from '../../src/core/domain/entities/Schedule';
import { randomUUID } from 'crypto';

describe('DeleteProfessionalUseCase', () => {
  it('should delete professional without schedules', async () => {
    const professionalRepo = new FakeProfessionalRepository();
    const scheduleRepo = new FakeScheduleRepository();
    const useCase = new DeleteProfessionalUseCase(
      professionalRepo,
      scheduleRepo,
    );

    const professional = Professional.create({
      id: randomUUID(),
      establishmentId: 'est-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    });

    await professionalRepo.save(professional);

    // Should delete successfully
    await useCase.execute({ professionalId: professional.id });

    const deleted = await professionalRepo.findById(professional.id);
    expect(deleted).toBeNull();
  });

  it('should prevent deleting professional with schedules', async () => {
    const professionalRepo = new FakeProfessionalRepository();
    const scheduleRepo = new FakeScheduleRepository();
    const useCase = new DeleteProfessionalUseCase(
      professionalRepo,
      scheduleRepo,
    );

    const professional = Professional.create({
      id: randomUUID(),
      establishmentId: 'est-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    });

    await professionalRepo.save(professional);

    // Add a schedule
    const schedule = Schedule.create({
      id: randomUUID(),
      establishmentId: 'est-1',
      professionalId: professional.id,
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '18:00',
    });

    await scheduleRepo.save(schedule);

    // Should prevent deletion
    await expect(
      useCase.execute({ professionalId: professional.id }),
    ).rejects.toThrow(
      'Cannot delete professional with active schedules. Delete schedules first.',
    );

    // Professional should still exist
    const stillExists = await professionalRepo.findById(professional.id);
    expect(stillExists).toBeDefined();
  });

  it('should throw error if professional not found', async () => {
    const professionalRepo = new FakeProfessionalRepository();
    const scheduleRepo = new FakeScheduleRepository();
    const useCase = new DeleteProfessionalUseCase(
      professionalRepo,
      scheduleRepo,
    );

    await expect(
      useCase.execute({ professionalId: 'non-existent' }),
    ).rejects.toThrow('Professional not found');
  });
});
