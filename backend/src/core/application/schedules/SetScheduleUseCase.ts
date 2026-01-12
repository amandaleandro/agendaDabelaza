import { randomUUID } from 'crypto';
import { Schedule } from '../../domain/entities/Schedule';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';

type ScheduleInput = {
  dayOfWeek: Schedule['dayOfWeek'];
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
};

export class SetScheduleUseCase {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(input: {
    establishmentId: string;
    professionalId: string;
    schedules: ScheduleInput[];
  }) {
    const schedules = input.schedules.map((item) =>
      Schedule.create({
        id: randomUUID(),
        establishmentId: input.establishmentId,
        professionalId: input.professionalId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isAvailable: item.isAvailable,
      }),
    );

    await this.scheduleRepository.replaceForProfessional(
      input.professionalId,
      schedules,
    );
    return schedules;
  }
}
