import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Param,
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

  @Get('email/:email')
  async getSubscriptionsByEmail(@Param('email') email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return [];
    }

    const subscriptions = await this.prisma.clientSubscription.findMany({
      where: { userId: user.id },
      include: { servicePlan: true },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      planId: sub.servicePlanId,
      planName: sub.planName,
      status: sub.status,
      startDate: sub.startedAt.toISOString(),
      expiryDate: sub.expiresAt.toISOString(),
      totalPrice: sub.price,
      remainingValue: Math.max(sub.price, 0),
    }));
  }

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

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  async upgradeSubscription(
    @Body()
    body: {
      clientEmail?: string;
      newPlanId?: string;
    },
  ) {
    if (!body.clientEmail || !body.newPlanId) {
      throw new BadRequestException('Email do cliente e novo plano sao obrigatorios');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: body.clientEmail },
    });

    if (!user) {
      throw new NotFoundException('Cliente nao encontrado');
    }

    const plan = await this.prisma.servicePlan.findUnique({
      where: { id: body.newPlanId },
      include: { establishment: true },
    });

    if (!plan || !plan.active) {
      throw new NotFoundException('Plano nao encontrado');
    }

    const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mercadoPagoToken) {
      throw new InternalServerErrorException(
        'Mercado Pago nao configurado no servidor',
      );
    }

    const externalReference = `client-plan-upgrade:${randomUUID()}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mercadoPagoToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: plan.id,
            title: `Plano ${plan.name}`,
            description: `Troca de plano para ${plan.establishment.name}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: Number(plan.price.toFixed(2)),
          },
        ],
        payer: {
          email: user.email,
          name: user.name || undefined,
        },
        external_reference: externalReference,
        notification_url: `${apiUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${frontendUrl}/minha-conta?payment=success&planId=${plan.id}`,
          pending: `${frontendUrl}/minha-conta?payment=pending&planId=${plan.id}`,
          failure: `${frontendUrl}/minha-conta?payment=failure&planId=${plan.id}`,
        },
        auto_return: 'approved',
      }),
    });

    const rawResponse = await response.text();
    let data: any = null;

    try {
      data = rawResponse ? JSON.parse(rawResponse) : null;
    } catch {
      data = { message: rawResponse };
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        data?.message || 'Nao foi possivel criar o checkout no Mercado Pago',
      );
    }

    const paymentUrl = data.init_point || data.sandbox_init_point;

    if (!paymentUrl) {
      throw new InternalServerErrorException(
        'Mercado Pago nao retornou um link de pagamento',
      );
    }

    return {
      success: true,
      paymentUrl,
      initPoint: paymentUrl,
      preferenceId: data.id,
    };
  }
}
