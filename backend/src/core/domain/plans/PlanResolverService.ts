import { Plan } from '../../domain/entities/Plan';
import { PlanCatalog } from './PlanCatalog';
import { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';

export class PlanResolverService {
  constructor(
    @Inject('SubscriptionRepository')
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async resolveByOwner(ownerId: string): Promise<Plan> {
    const subscription =
      await this.subscriptionRepository.findActiveByOwner(ownerId);

    if (!subscription) {
      return PlanCatalog.FREE;
    }

    return PlanCatalog[subscription.planType];
  }
}
