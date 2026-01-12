import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaAppointmentRepository } from '../core/infrastructure/database/repositories/PrismaAppointmentRepository';
import { PrismaSubscriptionRepository } from '../core/infrastructure/database/repositories/PrismaSubscriptionRepository';
import { PrismaServiceRepository } from '../core/infrastructure/database/repositories/PrismaServiceRepository';
import { PrismaScheduleRepository } from '../core/infrastructure/database/repositories/PrismaScheduleRepository';
import { PrismaPaymentRepository } from '../core/infrastructure/database/repositories/PrismaPaymentRepository';
import { CreateAppointmentUseCase } from '../core/application/appointments/CreateAppointmentUseCase';
import { CancelAppointmentUseCase } from '../core/application/appointments/CancelAppointmentUseCase';
import { CreateAppointmentPaymentLinkUseCase } from '../core/application/appointments/CreateAppointmentPaymentLinkUseCase';
import { CreateDepositPaymentUseCase } from '../core/application/payments/CreateDepositPaymentUseCase';
import { GetEstablishmentPlanUseCase } from '../core/application/subscriptions/GetEstablishmentPlanUseCase';
import { AppointmentController } from '../core/infrastructure/http/controllers/AppointmentController';
import { RefundController } from '../core/infrastructure/http/controllers/RefundController';
import { PlanResolverService } from '../core/domain/plans/PlanResolverService';
import { MercadoPagoGateway } from '../core/infrastructure/payment-gateway/MercadoPagoGateway';
import { ConsoleNotificationGateway } from '../core/infrastructure/notifications/ConsoleNotificationGateway';

@Module({
  controllers: [AppointmentController, RefundController],
  providers: [
    PrismaService,
    {
      provide: PrismaAppointmentRepository,
      useFactory: (prisma: PrismaService) => new PrismaAppointmentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaSubscriptionRepository,
      useFactory: (prisma: PrismaService) => new PrismaSubscriptionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaServiceRepository,
      useFactory: (prisma: PrismaService) => new PrismaServiceRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaScheduleRepository,
      useFactory: (prisma: PrismaService) => new PrismaScheduleRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaPaymentRepository,
      useFactory: (prisma: PrismaService) => new PrismaPaymentRepository(prisma),
      inject: [PrismaService],
    },
    MercadoPagoGateway,
    ConsoleNotificationGateway,
    {
      provide: PlanResolverService,
      useFactory: (subscriptionRepo) =>
        new PlanResolverService(subscriptionRepo),
      inject: [PrismaSubscriptionRepository],
    },
    {
      provide: CreateAppointmentUseCase,
      useFactory: (appointmentRepo, serviceRepo, scheduleRepo, notificationGateway) =>
        new CreateAppointmentUseCase(
          appointmentRepo,
          serviceRepo,
          scheduleRepo,
          notificationGateway,
        ),
      inject: [
        PrismaAppointmentRepository,
        PrismaServiceRepository,
        PrismaScheduleRepository,
        ConsoleNotificationGateway,
      ],
    },
    {
      provide: CancelAppointmentUseCase,
      useFactory: (repo, planResolver) =>
        new CancelAppointmentUseCase(repo, planResolver),
      inject: [PrismaAppointmentRepository, PlanResolverService],
    },
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
    {
      provide: GetEstablishmentPlanUseCase,
      useFactory: (prisma: PrismaService) =>
        new GetEstablishmentPlanUseCase(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateAppointmentPaymentLinkUseCase,
      useFactory: (appointmentRepo, getPlanUseCase, paymentRepo, gateway) =>
        new CreateAppointmentPaymentLinkUseCase(
          appointmentRepo,
          getPlanUseCase,
          paymentRepo,
          gateway,
        ),
      inject: [
        PrismaAppointmentRepository,
        GetEstablishmentPlanUseCase,
        PrismaPaymentRepository,
        MercadoPagoGateway,
      ],
    },
  ],
  exports: [
    CreateAppointmentUseCase,
    CancelAppointmentUseCase,
    CreateDepositPaymentUseCase,
    CreateAppointmentPaymentLinkUseCase,
  ],
})
export class AppointmentModule {}
