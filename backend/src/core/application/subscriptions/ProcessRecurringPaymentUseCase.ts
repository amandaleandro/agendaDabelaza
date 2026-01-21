import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';
import { EmailService } from '../../infrastructure/services/EmailService';

export interface ProcessRecurringPaymentInput {
  mpSubscriptionId: string;
  mpChargeId: string;
  status: 'approved' | 'pending' | 'rejected' | 'refunded';
  amount: number;
}

@Injectable()
export class ProcessRecurringPaymentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

    // Criar/atualizar histórico de pagamento da assinatura
    await this.prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: input.amount,
        status:
          input.status === 'approved'
            ? 'PAID'
            : input.status === 'rejected'
            ? 'FAILED'
            : input.status === 'refunded'
            ? 'REFUNDED'
            : 'PENDING',
        mpChargeId: input.mpChargeId,
        paidAt: input.status === 'approved' ? new Date() : null,
      },
    });

    if (input.status === 'approved') {
      // Pagamento aprovado - renovar assinatura
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Válido por mais 1 mês

      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const updatedSub = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          expiresAt: expiresAt,
          nextBillingDate: nextBillingDate,
        },
      });

      // Buscar dados do proprietário para email
      const owner = await this.prisma.owner.findUnique({
        where: { id: subscription.ownerId },
      });

      // Enviar email de confirmação de renovação
      if (owner?.email) {
        try {
          await this.emailService.sendEmail({
            to: owner.email,
            subject: 'Assinatura Renovada - Agendei',
            template: 'renewal_confirmation',
            variables: {
              ownerName: owner.name,
              planType: subscription.planType,
              amount: input.amount,
              expiresAt: expiresAt.toLocaleDateString('pt-BR'),
            },
          });
        } catch (err) {
          console.error('Erro ao enviar email de renovação:', err);
          // Não falhar o processo se email falhar
        }
      }

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
