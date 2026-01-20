import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaSubscriptionRepository } from '../core/infrastructure/database/repositories/PrismaSubscriptionRepository';
import { CreateSubscriptionUseCase } from '../core/application/subscriptions/CreateSubscriptionUseCase';
import { CancelSubscriptionUseCase } from '../core/application/subscriptions/CancelSubscriptionUseCase';
import { GetEstablishmentPlanUseCase } from '../core/application/subscriptions/GetEstablishmentPlanUseCase';
import { CreateSubscriptionPaymentUseCase } from '../core/application/subscriptions/CreateSubscriptionPaymentUseCase';
import { ProcessSubscriptionPaymentUseCase } from '../core/application/subscriptions/ProcessSubscriptionPaymentUseCase';
import { CheckSubscriptionStatusUseCase } from '../core/application/subscriptions/CheckSubscriptionStatusUseCase';
import { MercadoPagoSubscriptionService } from '../core/application/subscriptions/MercadoPagoSubscriptionService';
import { ProcessRecurringPaymentUseCase } from '../core/application/subscriptions/ProcessRecurringPaymentUseCase';
import { CancelRecurringSubscriptionUseCase } from '../core/application/subscriptions/CancelRecurringSubscriptionUseCase';
import { SubscriptionController } from '../core/infrastructure/http/controllers/SubscriptionController';

@Module({
  controllers: [SubscriptionController],
  providers: [
    PrismaService,
    MercadoPagoSubscriptionService,
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
      useFactory: (prisma: PrismaService, mpService: MercadoPagoSubscriptionService) =>
        new CreateSubscriptionPaymentUseCase(prisma, mpService),
      inject: [PrismaService, MercadoPagoSubscriptionService],
    },
    {
      provide: ProcessSubscriptionPaymentUseCase,
      useFactory: (prisma: PrismaService) =>
        new ProcessSubscriptionPaymentUseCase(prisma),
      inject: [PrismaService],
    },
    {
      provide: ProcessRecurringPaymentUseCase,
      useFactory: (prisma: PrismaService) =>
        new ProcessRecurringPaymentUseCase(prisma),
      inject: [PrismaService],
    },
    {
      provide: CancelRecurringSubscriptionUseCase,
      useFactory: (prisma: PrismaService, mpService: MercadoPagoSubscriptionService) =>
        new CancelRecurringSubscriptionUseCase(prisma, mpService),
      inject: [PrismaService, MercadoPagoSubscriptionService],
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
    ProcessRecurringPaymentUseCase,
    CancelRecurringSubscriptionUseCase,
    CheckSubscriptionStatusUseCase,
  ],
})
export class SubscriptionModule {}

