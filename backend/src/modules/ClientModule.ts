import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { PrismaClientRepository } from '../core/infrastructure/database/repositories/PrismaClientRepository';
import { CreateClientUseCase } from '../core/application/clients/CreateClientUseCase';
import { ClientController } from '../core/infrastructure/http/controllers/ClientController';

@Module({
  controllers: [ClientController],
  providers: [
    PrismaService,
    {
      provide: PrismaClientRepository,
      useFactory: (prisma: PrismaService) => new PrismaClientRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateClientUseCase,
      useFactory: (clientRepo) => new CreateClientUseCase(clientRepo),
      inject: [PrismaClientRepository],
    },
  ],
  exports: [CreateClientUseCase],
})
export class ClientModule {}
