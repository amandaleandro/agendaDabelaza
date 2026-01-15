import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';

export interface SubscriptionStatusOutput {
  isActive: boolean;
  isExpired: boolean;
  isPending: boolean;
  isOverdue: boolean;
  expiresAt: Date | null;
  daysUntilExpiration: number | null;
  planType: string;
  status: string;
}

@Injectable()
export class CheckSubscriptionStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(ownerId: string): Promise<SubscriptionStatusOutput> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      // Sem assinatura - criar FREE automática
      const freeSubscription = await this.prisma.subscription.create({
        data: {
          ownerId,
          planType: 'FREE',
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: null, // FREE nunca expira
        },
      });

      return {
        isActive: true,
        isExpired: false,
        isPending: false,
        isOverdue: false,
        expiresAt: null,
        daysUntilExpiration: null,
        planType: 'FREE',
        status: 'ACTIVE',
      };
    }

    const now = new Date();
    const isExpired = subscription.expiresAt ? subscription.expiresAt < now : false;
    const isPending = subscription.status === 'PENDING';
    const isActive = subscription.status === 'ACTIVE' && !isExpired;
    const isOverdue = isExpired && subscription.status === 'ACTIVE';

    let daysUntilExpiration: number | null = null;
    if (subscription.expiresAt) {
      const diffTime = subscription.expiresAt.getTime() - now.getTime();
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Se expirou, atualizar para EXPIRED
    if (isOverdue && subscription.status !== 'EXPIRED') {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      });
    }

    return {
      isActive,
      isExpired,
      isPending,
      isOverdue,
      expiresAt: subscription.expiresAt,
      daysUntilExpiration,
      planType: subscription.planType,
      status: isOverdue ? 'EXPIRED' : subscription.status,
    };
  }
}
