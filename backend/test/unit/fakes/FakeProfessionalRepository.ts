import { Professional } from '../../../src/core/domain/entities/Professional';
import { ProfessionalRepository } from '../../../src/core/domain/repositories/ProfessionalRepository';

export class FakeProfessionalRepository implements ProfessionalRepository {
  private professionals: Professional[] = [];

  async save(professional: Professional): Promise<void> {
    this.professionals.push(professional);
  }

  async findById(id: string): Promise<Professional | null> {
    return this.professionals.find((p) => p.id === id) ?? null;
  }

  async findByEstablishment(establishmentId: string): Promise<Professional[]> {
    return this.professionals.filter(
      (p) => p.establishmentId === establishmentId,
    );
  }

  async findByEmail(email: string): Promise<Professional[]> {
    return this.professionals.filter((p) => p.email === email);
  }

  async findAll(): Promise<Professional[]> {
    return this.professionals;
  }

  async update(professional: Professional): Promise<void> {
    const index = this.professionals.findIndex((p) => p.id === professional.id);
    if (index >= 0) {
      this.professionals[index] = professional;
    }
  }

  async updatePartial(
    id: string,
    data: Partial<Professional>,
  ): Promise<Professional> {
    const professional = await this.findById(id);
    if (!professional) {
      throw new Error('Professional not found');
    }

    const updated = Professional.restore({
      id: professional.id,
      establishmentId: professional.establishmentId,
      name: data.name ?? professional.name,
      email: data.email ?? professional.email,
      phone: data.phone ?? professional.phone,
      createdAt: professional.createdAt,
    });

    const index = this.professionals.findIndex((p) => p.id === id);
    if (index >= 0) {
      this.professionals[index] = updated;
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    this.professionals = this.professionals.filter((p) => p.id !== id);
  }
}
