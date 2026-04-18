import { Professional } from '../entities/Professional';

export interface ProfessionalRepository {
  save(professional: Professional): Promise<void>;
  findById(id: string): Promise<Professional | null>;
  findByEstablishment(establishmentId: string): Promise<Professional[]>;
  findByEmail(email: string): Promise<Professional[]>;
  findOneByEmail(email: string): Promise<Professional | null>;
  findAll(): Promise<Professional[]>;
  update(professional: Professional): Promise<void>;
  updatePartial(
    id: string,
    data: Partial<Professional> & { password?: string | null },
  ): Promise<Professional>;
  delete(id: string): Promise<void>;
}
