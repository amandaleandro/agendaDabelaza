import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlanResolverService } from '../core/domain/plans/PlanResolverService';
import { CreateDepositPaymentUseCase } from '../core/application/payments/CreateDepositPaymentUseCase';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaSubscriptionRepository } from '../core/infrastructure/database/repositories/PrismaSubscriptionRepository';
import { PrismaPaymentRepository } from '../core/infrastructure/database/repositories/PrismaPaymentRepository';
import { MercadoPagoGateway } from '../core/infrastructure/payment-gateway/MercadoPagoGateway';
import { PaymentController } from '../core/infrastructure/http/controllers/PaymentController';
import { MercadoPagoWebhookController } from '../core/infrastructure/http/controllers/MercadoPagoWebhookController';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentController, MercadoPagoWebhookController],
  providers: [
    PrismaService,
    {
      provide: PrismaSubscriptionRepository,
      useFactory: (prisma: PrismaService) => new PrismaSubscriptionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PlanResolverService,
      useFactory: (subscriptionRepo) =>
        new PlanResolverService(subscriptionRepo),
      inject: [PrismaSubscriptionRepository],
    },
    {
      provide: PrismaPaymentRepository,
      useFactory: (prisma: PrismaService) => new PrismaPaymentRepository(prisma),
      inject: [PrismaService],
    },
    MercadoPagoGateway,
    {
      provide: CreateDepositPaymentUseCase,
      useFactory: (paymentRepo, gateway, planResolver) =>
        new CreateDepositPaymentUseCase(paymentRepo, gateway, planResolver),
      inject: [
        PrismaPaymentRepository,
        MercadoPagoGateway,
        PlanResolverService,
      ],
    },
  ],
  exports: [CreateDepositPaymentUseCase, MercadoPagoGateway],
})
export class PaymentModule {}
