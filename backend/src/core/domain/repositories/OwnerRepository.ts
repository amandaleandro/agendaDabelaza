import { Owner } from '../entities/Owner';

export abstract class OwnerRepository {
  abstract save(owner: Owner): Promise<void>;
  abstract findByEmail(email: string): Promise<Owner | null>;
  abstract findById(id: string): Promise<Owner | null>;
  abstract updateGoogleId(ownerId: string, googleId: string): Promise<Owner>;
}
