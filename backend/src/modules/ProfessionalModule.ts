import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaProfessionalRepository } from '../core/infrastructure/database/repositories/PrismaProfessionalRepository';
import { PrismaServiceRepository } from '../core/infrastructure/database/repositories/PrismaServiceRepository';
import { PrismaScheduleRepository } from '../core/infrastructure/database/repositories/PrismaScheduleRepository';
import { PrismaProductRepository } from '../core/infrastructure/database/repositories/PrismaProductRepository';
import { CreateProfessionalUseCase } from '../core/application/professionals/CreateProfessionalUseCase';
import { CreateServiceUseCase } from '../core/application/services/CreateServiceUseCase';
import { ListProfessionalServicesUseCase } from '../core/application/services/ListProfessionalServicesUseCase';
import { SetScheduleUseCase } from '../core/application/schedules/SetScheduleUseCase';
import { ProfessionalController } from '../core/infrastructure/http/controllers/ProfessionalController';
import { ServiceController } from '../core/infrastructure/http/controllers/ServiceController';
import { ScheduleController } from '../core/infrastructure/http/controllers/ScheduleController';

@Module({
  controllers: [ProfessionalController, ServiceController, ScheduleController],
  providers: [
    PrismaService,
    {
      provide: PrismaProfessionalRepository,
      useFactory: (prisma: PrismaService) => new PrismaProfessionalRepository(prisma),
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
      provide: PrismaProductRepository,
      useFactory: (prisma: PrismaService) => new PrismaProductRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateProfessionalUseCase,
      useFactory: (professionalRepo) =>
        new CreateProfessionalUseCase(professionalRepo),
      inject: [PrismaProfessionalRepository],
    },
    {
      provide: CreateServiceUseCase,
      useFactory: (serviceRepo) => new CreateServiceUseCase(serviceRepo),
      inject: [PrismaServiceRepository],
    },
    {
      provide: ListProfessionalServicesUseCase,
      useFactory: (serviceRepo) =>
        new ListProfessionalServicesUseCase(serviceRepo),
      inject: [PrismaServiceRepository],
    },
    {
      provide: SetScheduleUseCase,
      useFactory: (scheduleRepo) => new SetScheduleUseCase(scheduleRepo),
      inject: [PrismaScheduleRepository],
    },
  ],
  exports: [
    CreateProfessionalUseCase,
    CreateServiceUseCase,
    SetScheduleUseCase,
  ],
})
export class ProfessionalModule {}
