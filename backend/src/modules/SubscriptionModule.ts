import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaSubscriptionRepository } from '../core/infrastructure/database/repositories/PrismaSubscriptionRepository';
import { CreateSubscriptionUseCase } from '../core/application/subscriptions/CreateSubscriptionUseCase';
import { CancelSubscriptionUseCase } from '../core/application/subscriptions/CancelSubscriptionUseCase';
import { GetEstablishmentPlanUseCase } from '../core/application/subscriptions/GetEstablishmentPlanUseCase';
import { SubscriptionController } from '../core/infrastructure/http/controllers/SubscriptionController';

@Module({
  controllers: [SubscriptionController],
  providers: [
    PrismaService,
    {
      provide: PrismaSubscriptionRepository,
      useFactory: (prisma: PrismaService) => new PrismaSubscriptionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateSubscriptionUseCase,
      useFactory: (subscriptionRepo) =>
        new CreateSubscriptionUseCase(subscriptionRepo),
      inject: [PrismaSubscriptionRepository],
    },
    {
      provide: CancelSubscriptionUseCase,
      useFactory: (subscriptionRepo) =>
        new CancelSubscriptionUseCase(subscriptionRepo),
      inject: [PrismaSubscriptionRepository],
    },
    {
      provide: GetEstablishmentPlanUseCase,
      useFactory: (prisma: PrismaService) =>
        new GetEstablishmentPlanUseCase(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [CreateSubscriptionUseCase, CancelSubscriptionUseCase, GetEstablishmentPlanUseCase],
})
export class SubscriptionModule {}
