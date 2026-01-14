import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('admin/growth')
export class AdminGrowthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('appointments')
  async getAppointmentGrowth(@Query('days') days: string = '30') {
    const daysNum = parseInt(days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Total de appointments no período
    const total = await this.prisma.appointment.count({
      where: { createdAt: { gte: startDate } },
    });

    // Completed
    const completed = await this.prisma.appointment.count({
      where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
    });

    // Canceled
    const canceled = await this.prisma.appointment.count({
      where: { createdAt: { gte: startDate }, status: 'CANCELLED' },
    });

    // Appointments por dia
    const byDay = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
      FROM appointments
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      total,
      completed,
      canceled,
      byDay,
      period: { days: daysNum, startDate },
    };
  }

  @Get('users')
  async getUserGrowth(@Query('days') days: string = '30') {
    const daysNum = parseInt(days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Total novo usuários
    const newUsers = await this.prisma.user.count({
      where: { createdAt: { gte: startDate } },
    });

    // Usuários por dia
    const byDay = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      newUsers,
      byDay,
      period: { days: daysNum, startDate },
    };
  }

  @Get('revenue')
  async getRevenueGrowth(@Query('days') days: string = '30') {
    const daysNum = parseInt(days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Total revenue
    const totalResult = await this.prisma.appointment.aggregate({
      _sum: { price: true },
      where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
    });
    const totalRevenue = totalResult._sum.price || 0;

    // Revenue por dia
    const byDay = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(price) as revenue,
        COUNT(*) as appointments
      FROM appointments
      WHERE created_at >= ${startDate} AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      totalRevenue,
      byDay,
      period: { days: daysNum, startDate },
    };
  }

  @Get('activity-summary')
  async getActivitySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Appointments Today
    const appointmentsToday = await this.prisma.appointment.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Users registered today
    const usersToday = await this.prisma.user.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Payments today
    const paymentsToday = await this.prisma.payment.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Subscriptions created today
    const subscriptionsToday = await this.prisma.subscription.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    return {
      appointmentsToday,
      usersToday,
      paymentsToday,
      subscriptionsToday,
      date: today,
    };
  }
}
