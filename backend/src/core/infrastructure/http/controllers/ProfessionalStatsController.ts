import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('professionals')
export class ProfessionalStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/stats')
  async getProfessionalStats(@Param('id') id: string) {
    // Contar atendimentos
    const appointments = await this.prisma.appointment.count({
      where: { professionalId: id, status: 'COMPLETED' },
    });

    // Calcular receita total dos atendimentos
    const appointmentRevenue = await this.prisma.appointment.aggregate({
      where: { professionalId: id, status: 'COMPLETED' },
      _sum: { price: true },
    });

    // Contar clientes únicos
    const clients = await this.prisma.appointment.findMany({
      where: { professionalId: id, status: 'COMPLETED' },
      distinct: ['userId'],
      select: { userId: true },
    });

    return {
      appointments,
      revenue: appointmentRevenue._sum.price || 0,
      clients: clients.length,
      rating: 0,
    };
  }
}
