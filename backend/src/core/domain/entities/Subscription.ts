import { PlanType } from './Plan';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
}

export class Subscription {
  constructor(
    public readonly id: string,
    public readonly ownerId: string, // estabelecimento ou cliente
    public readonly planType: PlanType,
    public status: SubscriptionStatus,
    public readonly startedAt: Date,
    public expiresAt: Date | null,
  ) {}

  cancel(): void {
    if (this.status !== SubscriptionStatus.ACTIVE) {
      throw new Error('Only active subscriptions can be canceled');
    }

    this.status = SubscriptionStatus.CANCELED;
    this.expiresAt = new Date();
  }

  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }
}
