import { Module } from '@nestjs/common';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';
import { ClientSubscriptionController } from '../core/infrastructure/http/controllers/ClientSubscriptionController';

@Module({
  controllers: [ClientSubscriptionController],
  providers: [PrismaService],
  exports: [],
})
export class ClientSubscriptionModule {}
