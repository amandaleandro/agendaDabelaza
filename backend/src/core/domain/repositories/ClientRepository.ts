import { Client } from '../entities/Client';

export interface ClientRepository {
  save(client: Client): Promise<void>;
  findById(id: string): Promise<Client | null>;
  findByEmail(email: string): Promise<Client | null>;
  findAll(): Promise<Client[]>;
  updatePartial(id: string, data: Partial<Client>): Promise<Client>;
  delete(id: string): Promise<void>;
}
