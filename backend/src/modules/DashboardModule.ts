import { Module } from '@nestjs/common';
import { DashboardController } from '../core/infrastructure/http/controllers/DashboardController';
import { PrismaModule } from '../core/infrastructure/database/prisma/PrismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
