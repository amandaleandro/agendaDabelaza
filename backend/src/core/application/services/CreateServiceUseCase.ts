import { randomUUID } from 'crypto';
import { Service } from '../../domain/entities/Service';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';

export class CreateServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: {
    establishmentId: string;
    professionalId: string;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
  }) {
    const service = Service.create({
      id: randomUUID(),
      establishmentId: input.establishmentId,
      professionalId: input.professionalId,
      name: input.name,
      description: input.description,
      price: input.price,
      durationMinutes: input.durationMinutes,
    });

    await this.serviceRepository.save(service);
    return service;
  }
}
