import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';

export interface ProcessSubscriptionPaymentInput {
  subscriptionId: string;
  mpPaymentId: string;
  status: 'approved' | 'pending' | 'rejected';
}

@Injectable()
export class ProcessSubscriptionPaymentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ProcessSubscriptionPaymentInput): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: input.subscriptionId },
    });

    if (!subscription) {
      throw new Error('Assinatura não encontrada');
    }

    // Buscar payment associado
    const payment = await this.prisma.payment.findFirst({
      where: {
        mpPreferenceId: { contains: input.subscriptionId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (input.status === 'approved') {
      // Pagamento aprovado - ativar assinatura
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Válido por 1 mês

      await this.prisma.subscription.update({
        where: { id: input.subscriptionId },
        data: {
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: expiresAt,
        },
      });

      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            mpPaymentId: input.mpPaymentId,
          },
        });
      }
    } else if (input.status === 'rejected') {
      // Pagamento rejeitado
      await this.prisma.subscription.update({
        where: { id: input.subscriptionId },
        data: {
          status: 'CANCELLED',
        },
      });

      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            mpPaymentId: input.mpPaymentId,
          },
        });
      }
    }
    // Se pending, mantém status atual
  }
}
