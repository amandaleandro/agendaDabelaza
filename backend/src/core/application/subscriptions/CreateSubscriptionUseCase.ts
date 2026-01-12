import { randomUUID } from 'crypto';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/Subscription';
import { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';
import { PlanType } from '../../domain/entities/Plan';

export class CreateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: { ownerId: string; planType: PlanType }) {
    const subscription = new Subscription(
      randomUUID(),
      input.ownerId,
      input.planType,
      SubscriptionStatus.ACTIVE,
      new Date(),
      null, // Free plan: no expiration
    );

    await this.subscriptionRepository.save(subscription);
    return subscription;
  }
}
