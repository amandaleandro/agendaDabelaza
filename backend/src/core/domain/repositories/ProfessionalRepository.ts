import { Professional } from '../entities/Professional';

export interface ProfessionalRepository {
  save(professional: Professional): Promise<void>;
  findById(id: string): Promise<Professional | null>;
  findByEstablishment(establishmentId: string): Promise<Professional[]>;
  findAll(): Promise<Professional[]>;
  update(professional: Professional): Promise<void>;
  updatePartial(id: string, data: Partial<Professional>): Promise<Professional>;
  delete(id: string): Promise<void>;
}
