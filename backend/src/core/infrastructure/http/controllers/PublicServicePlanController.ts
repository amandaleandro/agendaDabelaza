import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('public/service-plans')
export class PublicServicePlanController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /service-plans/public/:slug
  @Get(':slug')
  async listPublicServicePlans(@Param('slug') slug: string) {
    // Buscar estabelecimento pelo slug
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!establishment) throw new NotFoundException('Estabelecimento não encontrado');

    // Buscar planos de serviço desse estabelecimento
    const plans = await this.prisma.servicePlan.findMany({
      where: { establishmentId: establishment.id, active: true },
      orderBy: { createdAt: 'desc' },
    });

    // Buscar todos os serviços do estabelecimento
    const services = await this.prisma.service.findMany({
      where: { establishmentId: establishment.id },
    });

    // Montar resposta com os serviços detalhados de cada plano
    return plans.map((plan) => {
      // Suporte para benefits: string[] (serviceId)
      const planServices = (plan.benefits || []).map((serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        return service
          ? {
              serviceId: service.id,
              serviceName: service.name,
              quantity: 1, // Ajuste se necessário
              price: service.price,
            }
          : null;
      }).filter(Boolean);

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        totalPrice: plan.price,
        services: planServices,
      };
    });
  }
}
