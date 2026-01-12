import { Subscription } from '../../../domain/entities/Subscription';
import { SubscriptionRepository } from '../../../domain/repositories/SubscriptionRepository';

// Simple placeholder repository until a persistent store is added.
export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private readonly items = new Map<string, Subscription>();
  private readonly byId = new Map<string, Subscription>();

  async findActiveByOwner(ownerId: string): Promise<Subscription | null> {
    return this.items.get(ownerId) ?? null;
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.byId.get(id) ?? null;
  }

  async save(subscription: Subscription): Promise<void> {
    this.items.set(subscription.ownerId, subscription);
    this.byId.set(subscription.id, subscription);
  }

  async update(subscription: Subscription): Promise<void> {
    this.items.set(subscription.ownerId, subscription);
    this.byId.set(subscription.id, subscription);
  }

  async findAll(): Promise<Subscription[]> {
    return Array.from(this.byId.values());
  }
}
