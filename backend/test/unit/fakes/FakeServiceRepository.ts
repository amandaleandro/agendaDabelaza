import { Service } from '../../../src/core/domain/entities/Service';
import { ServiceRepository } from '../../../src/core/domain/repositories/ServiceRepository';

export class FakeServiceRepository implements ServiceRepository {
  private services: Service[] = [];

  async save(service: Service): Promise<void> {
    this.services.push(service);
  }

  async findById(id: string): Promise<Service | null> {
    return this.services.find((service) => service.id === id) ?? null;
  }

  async findByProfessional(professionalId: string): Promise<Service[]> {
    return this.services.filter(
      (service) => service.professionalId === professionalId,
    );
  }

  async update(service: Service): Promise<void> {
    const index = this.services.findIndex((s) => s.id === service.id);
    if (index >= 0) {
      this.services[index] = service;
    }
  }

  async delete(id: string): Promise<void> {
    this.services = this.services.filter((service) => service.id !== id);
  }

  async findAll(): Promise<Service[]> {
    return this.services;
  }
}
