import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

interface CreateServicePlanDto {
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxServices?: number;
  discount?: number;
  benefits: string[];
  active?: boolean;
}

@Controller('establishments')
export class ServicePlanController {
  constructor(private readonly prisma: PrismaService) {}

  // Listar planos de um estabelecimento (rota alternativa para compatibilidade)
  @Get('service-plans/establishment/:establishmentId')
  async listPlansAlternative(@Param('establishmentId') establishmentId: string) {
    const plans = await this.prisma.servicePlan.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.durationDays,
      maxServices: plan.maxServices,
      discount: plan.discount,
      benefits: plan.benefits,
      active: plan.active,
      createdAt: plan.createdAt.toISOString(),
    }));
  }

  // Listar planos de um estabelecimento
  @Get(':establishmentId/plans')
  async listPlans(@Param('establishmentId') establishmentId: string) {
    const plans = await this.prisma.servicePlan.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        maxServices: plan.maxServices,
        discount: plan.discount,
        benefits: plan.benefits,
        active: plan.active,
        createdAt: plan.createdAt.toISOString(),
      })),
    };
  }

  // Obter um plano específico
  @Get('plans/:planId')
  async getPlan(@Param('planId') planId: string) {
    const plan = await this.prisma.servicePlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { error: 'Plano não encontrado' };
    }

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.durationDays,
      maxServices: plan.maxServices,
      discount: plan.discount,
      benefits: plan.benefits,
      active: plan.active,
      createdAt: plan.createdAt.toISOString(),
    };
  }

  // Criar novo plano
  @Post(':establishmentId/plans')
  async createPlan(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: CreateServicePlanDto,
  ) {
    const plan = await this.prisma.servicePlan.create({
      data: {
        establishmentId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        durationDays: dto.durationDays,
        maxServices: dto.maxServices,
        discount: dto.discount,
        benefits: dto.benefits.filter((b) => b.trim() !== ''),
        active: dto.active ?? true,
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.durationDays,
      maxServices: plan.maxServices,
      discount: plan.discount,
      benefits: plan.benefits,
      active: plan.active,
      createdAt: plan.createdAt.toISOString(),
    };
  }

  // Atualizar plano
  @Put(':establishmentId/plans/:planId')
  async updatePlan(
    @Param('establishmentId') establishmentId: string,
    @Param('planId') planId: string,
    @Body() dto: Partial<CreateServicePlanDto>,
  ) {
    const plan = await this.prisma.servicePlan.update({
      where: { id: planId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.durationDays && { durationDays: dto.durationDays }),
        ...(dto.maxServices !== undefined && { maxServices: dto.maxServices }),
        ...(dto.discount !== undefined && { discount: dto.discount }),
        ...(dto.benefits && { benefits: dto.benefits.filter((b) => b.trim() !== '') }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.durationDays,
      maxServices: plan.maxServices,
      discount: plan.discount,
      benefits: plan.benefits,
      active: plan.active,
      createdAt: plan.createdAt.toISOString(),
    };
  }

  // Deletar plano
  @Delete(':establishmentId/plans/:planId')
  async deletePlan(
    @Param('establishmentId') establishmentId: string,
    @Param('planId') planId: string,
  ) {
    await this.prisma.servicePlan.delete({
      where: { id: planId },
    });

    return { success: true };
  }

  // Ativar/Desativar plano
  @Put(':establishmentId/plans/:planId/toggle')
  async togglePlan(
    @Param('establishmentId') establishmentId: string,
    @Param('planId') planId: string,
  ) {
    const plan = await this.prisma.servicePlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { error: 'Plano não encontrado' };
    }

    const updated = await this.prisma.servicePlan.update({
      where: { id: planId },
      data: { active: !plan.active },
    });

    return {
      id: updated.id,
      active: updated.active,
    };
  }
}
