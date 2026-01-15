import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaSubscriptionRepository } from '../core/infrastructure/database/repositories/PrismaSubscriptionRepository';
import { CreateSubscriptionUseCase } from '../core/application/subscriptions/CreateSubscriptionUseCase';
import { CancelSubscriptionUseCase } from '../core/application/subscriptions/CancelSubscriptionUseCase';
import { GetEstablishmentPlanUseCase } from '../core/application/subscriptions/GetEstablishmentPlanUseCase';
import { CreateSubscriptionPaymentUseCase } from '../core/application/subscriptions/CreateSubscriptionPaymentUseCase';
import { ProcessSubscriptionPaymentUseCase } from '../core/application/subscriptions/ProcessSubscriptionPaymentUseCase';
import { CheckSubscriptionStatusUseCase } from '../core/application/subscriptions/CheckSubscriptionStatusUseCase';
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
    {
      provide: CreateSubscriptionPaymentUseCase,
      useFactory: (prisma: PrismaService) =>
        new CreateSubscriptionPaymentUseCase(prisma),
      inject: [PrismaService],
    },
    {
      provide: ProcessSubscriptionPaymentUseCase,
      useFactory: (prisma: PrismaService) =>
        new ProcessSubscriptionPaymentUseCase(prisma),
      inject: [PrismaService],
    },
    {
      provide: CheckSubscriptionStatusUseCase,
      useFactory: (prisma: PrismaService) =>
        new CheckSubscriptionStatusUseCase(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [
    CreateSubscriptionUseCase, 
    CancelSubscriptionUseCase, 
    GetEstablishmentPlanUseCase,
    CreateSubscriptionPaymentUseCase,
    ProcessSubscriptionPaymentUseCase,
    CheckSubscriptionStatusUseCase,
  ],
})
export class SubscriptionModule {}

