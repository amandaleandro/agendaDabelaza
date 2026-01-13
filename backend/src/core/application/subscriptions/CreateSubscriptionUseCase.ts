import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/Subscription';
import type { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';
import { PlanType } from '../../domain/entities/Plan';

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @Inject('SubscriptionRepository')
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
