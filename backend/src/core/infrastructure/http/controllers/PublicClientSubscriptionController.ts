import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Param,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';
import { randomUUID } from 'crypto';

@Controller('public/client-subscriptions')
export class PublicClientSubscriptionController {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== COMPRAR PLANO DE SERVIÇO (SEM AUTENTICAÇÃO) ====================

  @Post('purchase/:servicePlanId')
  @HttpCode(HttpStatus.CREATED)
  async purchasePlan(
    @Param('servicePlanId') servicePlanId: string,
    @Body()
    body: {
      establishmentId: string;
      userEmail: string;
      userName?: string;
    },
  ) {
    // Verificar se estabelecimento existe
    const establishment = await this.prisma.establishment.findUnique({
      where: { id: body.establishmentId },
    });

    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    // Para este MVP, vamos criar a assinatura com dados básicos
    // Em uma versão futura, integrar com busca real do plano de serviço

    // Verificar se usuário existe
    let user = await this.prisma.user.findUnique({
      where: { email: body.userEmail },
    });

    // Se não existir, criar novo usuário
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: randomUUID(),
          name: body.userName || body.userEmail.split('@')[0],
          email: body.userEmail,
          phone: '',
        },
      });
    }

    // Calcular data de expiração (30 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Valores padrão para MVP
    const totalCredits = 10;
    const planName = 'Plano de Serviço';
    const price = 99.90;

    // Criar assinatura
    const subscription = await this.prisma.clientSubscription.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        establishmentId: body.establishmentId,
        servicePlanId: servicePlanId,
        planName: planName,
        totalCredits,
        usedCredits: 0,
        status: 'ACTIVE',
        price: price,
        expiresAt,
      },
    });

    // Registrar vínculo usuário-estabelecimento
    await this.prisma.userEstablishment.upsert({
      where: {
        userId_establishmentId: {
          userId: user.id,
          establishmentId: body.establishmentId,
        },
      },
      update: {
        lastAppointmentAt: new Date(),
      },
      create: {
        userId: user.id,
        establishmentId: body.establishmentId,
        firstAppointmentAt: new Date(),
        lastAppointmentAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Plano adquirido com sucesso!',
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        totalCredits: subscription.totalCredits,
        creditsRemaining: subscription.totalCredits - subscription.usedCredits,
        price: subscription.price,
        expiresAt: subscription.expiresAt.toISOString(),
      },
    };
  }
}
