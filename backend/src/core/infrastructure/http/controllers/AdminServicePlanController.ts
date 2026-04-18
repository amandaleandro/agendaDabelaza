import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

interface CreateServicePlanDto {
  establishmentId: string;
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

  @Post()
  async createPlan(@Body() dto: CreateServicePlanDto) {
    const plan = await this.prisma.servicePlan.create({
      data: {
        establishmentId: dto.establishmentId,
        name: dto.name,
        description: dto.description,
        price: dto.totalPrice,
        durationDays: 30,
        benefits: dto.services.map((service) => service.serviceId),
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

  @Put(':planId')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() dto: Partial<CreateServicePlanDto>,
  ) {
    const plan = await this.prisma.servicePlan.update({
      where: { id: planId },
      data: {
        ...(dto.establishmentId && { establishmentId: dto.establishmentId }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.totalPrice !== undefined && { price: dto.totalPrice }),
        ...(dto.services && { benefits: dto.services.map((service) => service.serviceId) }),
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

  @Delete(':planId')
  async deletePlan(@Param('planId') planId: string) {
    await this.prisma.servicePlan.delete({
      where: { id: planId },
    });

    return { success: true };
  }
}
