import { describe, it, expect } from '@jest/globals';
import { CreateProfessionalUseCase } from '../../src/core/application/professionals/CreateProfessionalUseCase';
import { FakeProfessionalRepository } from './fakes/FakeProfessionalRepository';
import { Professional } from '../../src/core/domain/entities/Professional';

describe('CreateProfessionalUseCase', () => {
  it('should create a professional successfully', async () => {
    const repository = new FakeProfessionalRepository();
    const useCase = new CreateProfessionalUseCase(repository);

    const professional = await useCase.execute({
      establishmentId: 'est-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    });

    expect(professional.id).toBeDefined();
    expect(professional.name).toBe('John Doe');
    expect(professional.email).toBe('john@example.com');
    expect(professional.establishmentId).toBe('est-1');

    const saved = await repository.findById(professional.id);
    expect(saved).toBeDefined();
  });

  it('should prevent creating professional with same email in different establishment', async () => {
    const repository = new FakeProfessionalRepository();
    const useCase = new CreateProfessionalUseCase(repository);

    // Create first professional
    await useCase.execute({
      establishmentId: 'est-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    });

    // Try to create second professional with same email in different establishment
    await expect(
      useCase.execute({
        establishmentId: 'est-2',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      }),
    ).rejects.toThrow(
      'Professional already linked to another establishment',
    );
  });

  it('should prevent creating duplicate professional in same establishment', async () => {
    const repository = new FakeProfessionalRepository();
    const useCase = new CreateProfessionalUseCase(repository);

    // Create first professional
    await useCase.execute({
      establishmentId: 'est-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    });

    // Try to create duplicate in same establishment
    await expect(
      useCase.execute({
        establishmentId: 'est-1',
        name: 'Jane Doe',
        email: 'john@example.com',
        phone: '9876543210',
      }),
    ).rejects.toThrow(
      'Professional already exists in this establishment',
    );
  });

  it('should allow multiple professionals with different emails in same establishment', async () => {
    const repository = new FakeProfessionalRepository();
    const useCase = new CreateProfessionalUseCase(repository);

    const prof1 = await useCase.execute({
      establishmentId: 'est-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    });

    const prof2 = await useCase.execute({
      establishmentId: 'est-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '9876543210',
    });

    expect(prof1.id).not.toBe(prof2.id);
    expect(prof1.email).not.toBe(prof2.email);
    expect(prof1.establishmentId).toBe(prof2.establishmentId);

    const all = await repository.findByEstablishment('est-1');
    expect(all).toHaveLength(2);
  });

  it('should allow freelancer to work with multiple establishments', async () => {
    const repository = new FakeProfessionalRepository();
    const useCase = new CreateProfessionalUseCase(repository);

    // Create first professional as freelancer
    const prof1 = await useCase.execute({
      establishmentId: 'est-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      freelancer: true,
    });

    // Create second professional with same email in different establishment (freelancer allowed)
    const prof2 = await useCase.execute({
      establishmentId: 'est-2',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      freelancer: true,
    });

    expect(prof1.id).not.toBe(prof2.id);
    expect(prof1.email).toBe(prof2.email);
    expect(prof1.establishmentId).not.toBe(prof2.establishmentId);
    expect(prof1.freelancer).toBe(true);
    expect(prof2.freelancer).toBe(true);

    const est1Professionals = await repository.findByEstablishment('est-1');
    const est2Professionals = await repository.findByEstablishment('est-2');

    expect(est1Professionals).toHaveLength(1);
    expect(est2Professionals).toHaveLength(1);
  });
});
