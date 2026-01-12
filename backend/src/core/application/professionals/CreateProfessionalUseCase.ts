import { randomUUID } from 'crypto';
import { Professional } from '../../domain/entities/Professional';
import { ProfessionalRepository } from '../../domain/repositories/ProfessionalRepository';

export class CreateProfessionalUseCase {
  constructor(
    private readonly professionalRepository: ProfessionalRepository,
  ) {}

  async execute(input: {
    establishmentId: string;
    name: string;
    email: string;
    phone: string;
    stripeAccountId?: string;
  }) {
    const professional = Professional.create({
      id: randomUUID(),
      establishmentId: input.establishmentId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      stripeAccountId: input.stripeAccountId,
    });

    await this.professionalRepository.save(professional);
    return professional;
  }
}
