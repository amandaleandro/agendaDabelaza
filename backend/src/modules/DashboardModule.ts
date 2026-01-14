import { Module } from '@nestjs/common';
import { DashboardController } from '../core/infrastructure/http/controllers/DashboardController';
import { AdminMetricsController } from '../core/infrastructure/http/controllers/AdminMetricsController';
import { AdminGrowthController } from '../core/infrastructure/http/controllers/AdminGrowthController';
import { AdminSettingsController } from '../core/infrastructure/http/controllers/AdminSettingsController';
import { PrismaService } from '../core/infrastructure/database/prisma/PrismaService';

@Module({
  providers: [PrismaService],
  controllers: [DashboardController, AdminMetricsController, AdminGrowthController, AdminSettingsController],
})
export class DashboardModule {}
