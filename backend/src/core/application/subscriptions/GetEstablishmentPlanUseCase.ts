import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';

export interface EstablishmentPlan {
  planType: string;
  platformFeePercent: number;
  monthlyPrice: number;
  hasCommission: boolean;
}

/**
 * Retorna o plano ativo de um estabelecimento
 * Usado para calcular comissões e permissões
 */
export class GetEstablishmentPlanUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(establishmentId: string): Promise<EstablishmentPlan> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        establishmentId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Se não tem assinatura, considera plano FREE
    if (!subscription) {
      return {
        planType: 'FREE',
        platformFeePercent: 10,
        monthlyPrice: 0,
        hasCommission: true,
      };
    }

    return {
      planType: subscription.planType,
      platformFeePercent: subscription.platformFeePercent,
      monthlyPrice: subscription.price,
      hasCommission: subscription.platformFeePercent > 0,
    };
  }
}
