import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PublicEstablishmentController } from '../core/infrastructure/http/controllers/PublicEstablishmentController';
import { PublicAppointmentController } from '../core/infrastructure/http/controllers/PublicAppointmentController';
import { PublicClientSubscriptionController } from '../core/infrastructure/http/controllers/PublicClientSubscriptionController';
import { EstablishmentController } from '../core/infrastructure/http/controllers/EstablishmentController';
import { ServicePlanController } from '../core/infrastructure/http/controllers/ServicePlanController';
import { AdminServicePlanController } from '../core/infrastructure/http/controllers/AdminServicePlanController';
import { PrismaEstablishmentRepository } from '../core/infrastructure/repositories/PrismaEstablishmentRepository';
import { AppointmentModule } from './AppointmentModule';
import { PublicAuthController } from '../core/infrastructure/http/controllers/PublicAuthController';
import { PublicUserController } from '../core/infrastructure/http/controllers/PublicUserController';
import { PublicServicePlanController } from '../core/infrastructure/http/controllers/PublicServicePlanController';

@Module({
  imports: [AppointmentModule],
  controllers: [PublicEstablishmentController, PublicAppointmentController, PublicClientSubscriptionController, EstablishmentController, ServicePlanController, AdminServicePlanController, PublicAuthController, PublicUserController, PublicServicePlanController],
  providers: [
    PrismaService,
    {
      provide: PrismaEstablishmentRepository,
      useFactory: (prisma: PrismaService) => new PrismaEstablishmentRepository(prisma),
      inject: [PrismaService],
    },
  ],
})
export class PublicModule {}
