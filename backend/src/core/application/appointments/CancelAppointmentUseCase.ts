import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { PlanResolverService } from '../../domain/plans/PlanResolverService';

export class CancelAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly planResolver: PlanResolverService,
  ) {}

  async execute(input: {
    appointmentId: string;
    now: Date;
  }): Promise<{ fee: number }> {
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const plan = await this.planResolver.resolveByOwner(
      appointment.professionalId,
    );

    const fee = appointment.cancelWithFee(
      input.now,
      plan.cancellationWindowHours,
      plan.cancellationFeePercent,
    );

    await this.appointmentRepository.update(appointment);

    // Sempre retornamos a taxa calculada (zero quando dentro da janela grátis).
    return { fee };
  }
}
