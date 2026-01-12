import { randomUUID } from 'crypto';
import { Client } from '../../domain/entities/Client';
import { ClientRepository } from '../../domain/repositories/ClientRepository';

export class CreateClientUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(input: { name: string; email: string; phone: string }) {
    const existing = await this.clientRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('Client already exists with this email');
    }

    const client = Client.create({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      phone: input.phone,
    });

    await this.clientRepository.save(client);
    return client;
  }
}
