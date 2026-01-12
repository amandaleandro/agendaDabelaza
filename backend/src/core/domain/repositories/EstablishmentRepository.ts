import { Establishment } from '../entities/Establishment';

export abstract class EstablishmentRepository {
  abstract save(establishment: Establishment): Promise<void>;
  abstract findBySlug(slug: string): Promise<Establishment | null>;
  abstract findByOwnerId(ownerId: string): Promise<Establishment | null>;
}
