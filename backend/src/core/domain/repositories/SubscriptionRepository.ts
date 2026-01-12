import { Subscription } from '../entities/Subscription';

export interface SubscriptionRepository {
  findActiveByOwner(ownerId: string): Promise<Subscription | null>;
  findById(id: string): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<void>;
  update(subscription: Subscription): Promise<void>;
  findAll(): Promise<Subscription[]>;
}
