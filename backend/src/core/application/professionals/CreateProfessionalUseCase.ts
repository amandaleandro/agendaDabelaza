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
    return professional;
  }
}
