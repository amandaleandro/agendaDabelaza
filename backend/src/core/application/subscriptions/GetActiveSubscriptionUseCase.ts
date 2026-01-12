import { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';

export class GetActiveSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(ownerId: string) {
    return this.subscriptionRepository.findActiveByOwner(ownerId);
  }
}
