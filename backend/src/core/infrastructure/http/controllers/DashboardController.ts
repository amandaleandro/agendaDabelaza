import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats(@Query('establishmentId') establishmentId?: string) {
    const where = establishmentId ? { establishmentId } : {};

    // Data para filtrar últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Queries otimizadas em paralelo
    const [
      totalAppointments,
      recentAppointments,
      totalRevenue,
      totalClients,
      totalServices,
      topServices,
    ] = await Promise.all([
      // Total de agendamentos (últimos 30 dias)
      this.prisma.appointment.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Agendamentos recentes (últimos 10)
      this.prisma.appointment.findMany({
        where,
        take: 10,
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          price: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          service: {
            select: {
              name: true,
            },
          },
          professional: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Receita total (pagamentos confirmados nos últimos 30 dias)
      this.prisma.payment.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: {
          amount: true,
        },
      }),

      // Total de clientes únicos
      this.prisma.user.count(),

      // Total de serviços
      this.prisma.service.count({ where }),

      // Top 5 serviços mais agendados
      this.prisma.appointment.groupBy({
        by: ['serviceId'],
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: {
          serviceId: true,
        },
        orderBy: {
          _count: {
            serviceId: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Buscar detalhes dos top services
    const serviceIds = topServices.map((s) => s.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    const topServicesWithDetails = topServices.map((item) => {
      const service = services.find((s) => s.id === item.serviceId);
      return {
        service,
        count: item._count.serviceId,
      };
    });

    return {
      totalAppointments,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalClients,
      totalServices,
      recentAppointments: recentAppointments.map((apt) => ({
        id: apt.id,
        scheduledAt: apt.scheduledAt.toISOString(),
        status: apt.status,
        price: apt.price,
        user: apt.user,
        service: apt.service,
        professional: apt.professional,
      })),
      topServices: topServicesWithDetails,
    };
  }

  @Get('revenue-by-day')
  async getRevenueByDay(
    @Query('days') days: string = '7',
    @Query('establishmentId') establishmentId?: string,
  ) {
    const numDays = parseInt(days, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: startDate },
        ...(establishmentId
          ? {
              appointment: {
                establishmentId,
              },
            }
          : {}),
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Agrupar por dia
    const revenueByDay = new Map<string, number>();
    
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      revenueByDay.set(key, 0);
    }

    payments.forEach((payment) => {
      const day = payment.createdAt.toISOString().split('T')[0];
      const current = revenueByDay.get(day) || 0;
      revenueByDay.set(day, current + payment.amount);
    });

    return Array.from(revenueByDay.entries()).map(([date, amount]) => ({
      day: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'short',
      }),
      date,
      amount,
    }));
  }
}
