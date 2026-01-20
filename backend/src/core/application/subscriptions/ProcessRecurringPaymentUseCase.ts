import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';

export interface ProcessRecurringPaymentInput {
  mpSubscriptionId: string;
  mpChargeId: string;
  status: 'approved' | 'pending' | 'rejected' | 'refunded';
  amount: number;
}

@Injectable()
export class ProcessRecurringPaymentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ProcessRecurringPaymentInput): Promise<void> {
    // Buscar subscription pelo ID do Mercado Pago
    const subscription = await this.prisma.subscription.findUnique({
      where: { mpSubscriptionId: input.mpSubscriptionId },
    });

    if (!subscription) {
      console.warn(
        `Subscription não encontrada para MP ID: ${input.mpSubscriptionId}`,
      );
      return;
    }

    console.log('🔄 Processando charge recorrente:', {
      subscriptionId: subscription.id,
      chargeId: input.mpChargeId,
      status: input.status,
    });

    if (input.status === 'approved') {
      // Pagamento aprovado - renovar assinatura
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Válido por mais 1 mês

      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          expiresAt: expiresAt,
          nextBillingDate: nextBillingDate,
        },
      });

      console.log('✅ Subscription renovada com sucesso:', {
        subscriptionId: subscription.id,
        expiresAt: expiresAt.toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
      });
    } else if (input.status === 'rejected') {
      // Pagamento rejeitado - marcar como PAST_DUE
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
        },
      });

      console.log('⚠️ Pagamento rejeitado, subscription marcada como PAST_DUE:', {
        subscriptionId: subscription.id,
      });
    } else if (input.status === 'pending') {
      // Pagamento pendente - manter status atual
      console.log('⏳ Pagamento pendente:', {
        subscriptionId: subscription.id,
      });
    } else if (input.status === 'refunded') {
      // Pagamento reembolsado - cancelar assinatura
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      console.log('💔 Pagamento reembolsado, subscription cancelada:', {
        subscriptionId: subscription.id,
      });
    }
  }
}
