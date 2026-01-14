import { Module } from '@nestjs/common';
import { DashboardController } from '../core/infrastructure/http/controllers/DashboardController';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';

@Module({
  providers: [PrismaService],
  controllers: [DashboardController],
})
export class DashboardModule {}
