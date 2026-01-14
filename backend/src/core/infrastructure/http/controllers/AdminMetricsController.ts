import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('admin/metrics')
export class AdminMetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async getDashboardMetrics() {
    // Contar estabelecimentos
    const totalEstablishments = await this.prisma.establishment.count();

    // Contar assinaturas ativas
    const totalSubscriptions = await this.prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    // Contar todos os appointments
    const totalAppointments = await this.prisma.appointment.count();

    // Contar usuários ativos (clientes)
    const activeUsers = await this.prisma.user.count();

    // Calcular receita total (soma dos appointment prices)
    const revenueResult = await this.prisma.appointment.aggregate({
      _sum: { price: true },
      where: { status: 'COMPLETED' },
    });
    const totalRevenue = revenueResult._sum.price || 0;

    // Appointmentscompletados
    const completedAppointments = await this.prisma.appointment.count({
      where: { status: 'COMPLETED' },
    });

    // Appointments cancelados
    const canceledAppointments = await this.prisma.appointment.count({
      where: { status: 'CANCELLED' },
    });

    // Pendentes
    const pendingAppointments = await this.prisma.appointment.count({
      where: { status: 'PENDING' },
    });

    return {
      totalEstablishments,
      totalSubscriptions,
      totalRevenue,
      activeUsers,
      totalAppointments,
      completedAppointments,
      canceledAppointments,
      pendingAppointments,
      appointmentStats: {
        completed: completedAppointments,
        canceled: canceledAppointments,
        pending: pendingAppointments,
      },
    };
  }

  @Get('users')
  async getUsersMetrics() {
    const total = await this.prisma.user.count();
    const professionals = await this.prisma.professional.count();
    const clients = await this.prisma.user.count();
    const owners = await this.prisma.owner.count();

    return {
      total,
      professionals,
      clients,
      owners,
    };
  }

  @Get('establishments')
  async getEstablishmentsMetrics() {
    const total = await this.prisma.establishment.count();
    
    // Estabelecimentos com maioresreceitas
    const revenueByEstablishment = await this.prisma.appointment.groupBy({
      by: ['establishmentId'],
      _sum: { price: true },
      _count: { id: true },
      where: { status: 'COMPLETED' },
      orderBy: { _sum: { price: 'desc' } },
      take: 5,
    });

    return {
      total,
      topByRevenue: revenueByEstablishment,
    };
  }

  @Get('subscriptions')
  async getSubscriptionsMetrics() {
    const total = await this.prisma.subscription.count();
    const active = await this.prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });
    const expired = await this.prisma.subscription.count({
      where: { status: 'EXPIRED' },
    });
    const canceled = await this.prisma.subscription.count({
      where: { status: 'CANCELLED' },
    });

    // Contagem por tipo de plano
    const byPlan = await this.prisma.subscription.groupBy({
      by: ['planType'],
      _count: { id: true },
    });

    return {
      total,
      active,
      expired,
      canceled,
      byPlan,
    };
  }
}
