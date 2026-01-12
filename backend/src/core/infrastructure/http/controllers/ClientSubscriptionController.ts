import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Put,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';
import { randomUUID } from 'crypto';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

@Controller('client-subscriptions')
export class ClientSubscriptionController {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== LISTAR ASSINATURAS DO CLIENTE ====================

  @Get('my-subscriptions')
  async getMySubscriptions(@Request() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotFoundException('Usuário não autenticado');
    }

    const subscriptions = await this.prisma.clientSubscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      planName: sub.planName,
      totalCredits: sub.totalCredits,
      usedCredits: sub.usedCredits,
      creditsRemaining: sub.totalCredits - sub.usedCredits,
      status: sub.status,
      price: sub.price,
      startedAt: sub.startedAt.toISOString(),
      expiresAt: sub.expiresAt.toISOString(),
      servicePlanId: sub.servicePlanId,
    }));
  }

  // ==================== LISTAR ASSINATURAS DE UM ESTABELECIMENTO (CLIENTE) ====================

  @Get('establishment/:establishmentId')
  async getEstablishmentSubscriptions(
    @Param('establishmentId') establishmentId: string,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotFoundException('Usuário não autenticado');
    }

    const subscriptions = await this.prisma.clientSubscription.findMany({
      where: {
        userId,
        establishmentId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      planName: sub.planName,
      totalCredits: sub.totalCredits,
      usedCredits: sub.usedCredits,
      creditsRemaining: sub.totalCredits - sub.usedCredits,
      status: sub.status,
      price: sub.price,
      startedAt: sub.startedAt.toISOString(),
      expiresAt: sub.expiresAt.toISOString(),
      servicePlanId: sub.servicePlanId,
    }));
  }

  // ==================== CANCELAR ASSINATURA ====================

  @Delete(':subscriptionId')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = await this.prisma.clientSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    await this.prisma.clientSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
      },
    });

    return {
      success: true,
      message: 'Assinatura cancelada com sucesso!',
    };
  }
}
