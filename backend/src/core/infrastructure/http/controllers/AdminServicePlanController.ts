import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

interface CreateServicePlanDto {
  name: string;
  description: string;
  totalPrice: number;
  services: Array<{
    serviceId: string;
    quantity: number;
    price: number;
  }>;
}

@Controller('service-plans')
export class AdminServicePlanController {
  constructor(private readonly prisma: PrismaService) {}

  // Listar planos de um estabelecimento
  @Get('establishment/:establishmentId')
  async listPlans(@Param('establishmentId') establishmentId: string) {
    const plans = await this.prisma.servicePlan.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      totalPrice: plan.price,
      durationDays: plan.durationDays,
      maxServices: plan.maxServices,
      discount: plan.discount,
      benefits: plan.benefits,
      active: plan.active,
      status: plan.active ? 'ACTIVE' : 'INACTIVE',
      services: plan.benefits || [],
      createdAt: plan.createdAt.toISOString(),
    }));
  }

  // Obter um plano específico
  @Get(':planId')
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
      totalPrice: plan.price,
      durationDays: plan.durationDays,
      maxServices: plan.maxServices,
      discount: plan.discount,
      benefits: plan.benefits,
      active: plan.active,
      status: plan.active ? 'ACTIVE' : 'INACTIVE',
      services: plan.benefits || [],
      createdAt: plan.createdAt.toISOString(),
    };
  }

  // Criar novo plano
  @Post()
  async createPlan(@Body() dto: CreateServicePlanDto) {
    // Para agora, vou criar um plano sem estabelecimento específico
    // O frontend pode passar o establishmentId no body ou na sessão
    const plan = await this.prisma.servicePlan.create({
      data: {
        establishmentId: '', // Será preenchido pelo frontend
        name: dto.name,
        description: dto.description,
        price: dto.totalPrice,
        durationDays: 30, // Default
        benefits: dto.services.map((s) => s.serviceId),
        active: true,
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      totalPrice: plan.price,
      durationDays: plan.durationDays,
      benefits: plan.benefits,
      active: plan.active,
      status: plan.active ? 'ACTIVE' : 'INACTIVE',
      services: dto.services,
      createdAt: plan.createdAt.toISOString(),
    };
  }

  // Atualizar plano
  @Put(':planId')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() dto: Partial<CreateServicePlanDto>,
  ) {
    const plan = await this.prisma.servicePlan.update({
      where: { id: planId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.totalPrice !== undefined && { price: dto.totalPrice }),
        ...(dto.services && { benefits: dto.services.map((s) => s.serviceId) }),
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      totalPrice: plan.price,
      durationDays: plan.durationDays,
      benefits: plan.benefits,
      active: plan.active,
      status: plan.active ? 'ACTIVE' : 'INACTIVE',
      services: dto.services || [],
      createdAt: plan.createdAt.toISOString(),
    };
  }

  // Deletar plano
  @Delete(':planId')
  async deletePlan(@Param('planId') planId: string) {
    await this.prisma.servicePlan.delete({
      where: { id: planId },
    });

    return { success: true };
  }
}
