import { ServiceRepository } from '../../domain/repositories/ServiceRepository';

export class ListProfessionalServicesUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(professionalId: string) {
    return this.serviceRepository.findByProfessional(professionalId);
  }
}
