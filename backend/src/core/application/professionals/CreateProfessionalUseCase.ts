import { randomUUID } from 'crypto';
import { Professional } from '../../domain/entities/Professional';
import { ProfessionalRepository } from '../../domain/repositories/ProfessionalRepository';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';

export class CreateProfessionalUseCase {
  constructor(
    private readonly professionalRepository: ProfessionalRepository,
    private readonly scheduleRepository: ScheduleRepository,
  ) {}

  async execute(input: {
    establishmentId: string;
    name: string;
    email: string;
    phone: string;
    freelancer?: boolean;
  }) {
    const existingByEmail = await this.professionalRepository.findByEmail(
      input.email,
    );

    const existsInOtherEstablishment = existingByEmail.find(
      (professional) => professional.establishmentId !== input.establishmentId,
    );
    // Only prevent cross-establishment linking if NOT freelancer
    if (existsInOtherEstablishment && !input.freelancer) {
      throw new Error('Professional already linked to another establishment');
    }

    const existsInSameEstablishment = existingByEmail.find(
      (professional) => professional.establishmentId === input.establishmentId,
    );
    if (existsInSameEstablishment) {
      throw new Error('Professional already exists in this establishment');
    }

    const professional = Professional.create({
      id: randomUUID(),
      establishmentId: input.establishmentId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      freelancer: input.freelancer ?? false,
    });

    await this.professionalRepository.save(professional);

    // Create default schedules (9 AM to 6 PM, Monday to Friday)
    const defaultSchedules = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ].map((dayOfWeek) =>
      Schedule.create({
        id: randomUUID(),
        establishmentId: input.establishmentId,
        professionalId: professional.id,
        dayOfWeek,
        startTime: '09:00',
        endTime: '18:00',
        isAvailable: true,
      }),
    );

    await this.scheduleRepository.replaceForProfessional(
      professional.id,
      defaultSchedules,
    );

    return professional;
  }
}
