import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';
import { MercadoPagoSubscriptionService } from './MercadoPagoSubscriptionService';

export interface CancelSubscriptionInput {
  subscriptionId: string;
}

@Injectable()
export class CancelRecurringSubscriptionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoSubscriptionService,
  ) {}

  async execute(input: CancelSubscriptionInput): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: input.subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription não encontrada');
    }

    console.log('📤 Cancelando subscription:', {
      subscriptionId: subscription.id,
      mpSubscriptionId: subscription.mpSubscriptionId,
    });

    // Se tiver MP Subscription ID, cancelar no Mercado Pago
    if (subscription.mpSubscriptionId) {
      try {
        await this.mercadoPagoService.cancelSubscription(
          subscription.mpSubscriptionId,
        );
      } catch (error: any) {
        console.error(
          'Erro ao cancelar subscription no Mercado Pago:',
          error.message,
        );
        // Continuar mesmo com erro no MP, para atualizar localmente
      }
    }

    // Atualizar status localmente
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        autoRenewal: false,
      },
    });

    console.log('✅ Subscription cancelada com sucesso');
  }
}
