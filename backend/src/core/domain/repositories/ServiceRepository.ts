import { Service } from '../entities/Service';

export interface ServiceRepository {
  save(service: Service): Promise<void>;
  findById(id: string): Promise<Service | null>;
  findAll(): Promise<Service[]>;
  findByProfessional(professionalId: string): Promise<Service[]>;
  update(service: Service): Promise<void>;
  delete(id: string): Promise<void>;
}
