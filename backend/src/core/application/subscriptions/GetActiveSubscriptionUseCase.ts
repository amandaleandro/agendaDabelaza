import { Inject } from '@nestjs/common';
import type { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';

export class GetActiveSubscriptionUseCase {
  constructor(
    @Inject('SubscriptionRepository')
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(ownerId: string) {
    return this.subscriptionRepository.findActiveByOwner(ownerId);
  }
}
