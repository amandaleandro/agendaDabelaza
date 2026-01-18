import { ProfessionalRepository } from '../../domain/repositories/ProfessionalRepository';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';

export class DeleteProfessionalUseCase {
  constructor(
    private readonly professionalRepository: ProfessionalRepository,
    private readonly scheduleRepository: ScheduleRepository,
  ) {}

  async execute(input: { professionalId: string }) {
    const professional = await this.professionalRepository.findById(
      input.professionalId,
    );

    if (!professional) {
      throw new Error('Professional not found');
    }

    // Check if professional has schedules
    const schedules = await this.scheduleRepository.findByProfessional(
      input.professionalId,
    );

    if (schedules.length > 0) {
      throw new Error(
        'Cannot delete professional with active schedules. Delete schedules first.',
      );
    }

    await this.professionalRepository.delete(input.professionalId);
  }
}
