import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';
import { PlanType } from '../../domain/entities/Plan';
import { MercadoPagoSubscriptionService } from './MercadoPagoSubscriptionService';

export interface CreateSubscriptionPaymentInput {
  establishmentId: string;
  ownerId: string;
  planType: PlanType;
  payerEmail: string;
}

export interface CreateSubscriptionPaymentOutput {
  paymentId: string;
  preferenceId?: string;
  subscriptionId: string;
  initPoint: string;
  amount: number;
  isRecurring: boolean;
}

@Injectable()
export class CreateSubscriptionPaymentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoSubscriptionService,
  ) {}

  async execute(input: CreateSubscriptionPaymentInput): Promise<CreateSubscriptionPaymentOutput> {
    // Configuração dos planos
    const planPrices = {
      [PlanType.FREE]: 0,
      [PlanType.BASIC]: 49.90,
      [PlanType.PRO]: 99.90,
      [PlanType.PREMIUM]: 199.90,
    };

    const amount = planPrices[input.planType];

    if (amount === 0) {
      throw new Error('Plano gratuito não requer pagamento');
    }

    // Calcular data de fim do trial (14 dias)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Criar assinatura com trial de 14 dias
    const subscription = await this.prisma.subscription.create({
      data: {
        id: randomUUID(),
        ownerId: input.ownerId,
        establishmentId: input.establishmentId,
        planType: input.planType,
        status: 'TRIAL', // Inicia com TRIAL, muda para ACTIVE após primeiro pagamento
        price: amount,
        autoRenewal: true,
        startedAt: new Date(),
        trialEndsAt: trialEndsAt,
        expiresAt: null, // Será definido após pagamento
        nextBillingDate: null,
      },
    });

    // Configurar assinatura recorrente do Mercado Pago
    const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!mercadoPagoToken) {
      console.warn('MERCADOPAGO_ACCESS_TOKEN não configurado - modo simulação');
      
      // Modo simulação: retornar dados fake
      return {
        paymentId: 'SIMULATED',
        subscriptionId: subscription.id,
        initPoint: `/admin/assinatura/payment-success?subscription_id=${subscription.id}`,
        amount: amount,
        isRecurring: true,
      };
    }

    try {
      // Criar assinatura recorrente com Mercado Pago
      const mpSubscriptionResponse =
        await this.mercadoPagoService.createSubscription({
          reason: `Plano ${input.planType} - Agendei (Renovação Automática Mensal)`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
          },
          payer_email: input.payerEmail,
          back_urls: {
            success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/assinatura/payment-success`,
            failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/assinatura/payment-failure`,
            pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/assinatura/payment-pending`,
          },
          external_reference: subscription.id,
          notification_url: `${process.env.API_URL || 'http://localhost:3001'}/api/subscriptions/webhook/mercadopago`,
        });

      // Atualizar subscription com ID do Mercado Pago
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          mpSubscriptionId: mpSubscriptionResponse.id,
          mercadoPagoId: mpSubscriptionResponse.id,
        },
      });

      const initPoint =
        mpSubscriptionResponse.init_point ||
        mpSubscriptionResponse.sandbox_init_point;

      if (!initPoint) {
        throw new Error('Mercado Pago não retornou init_point');
      }

      return {
        paymentId: mpSubscriptionResponse.id,
        subscriptionId: subscription.id,
        initPoint: initPoint,
        amount: amount,
        isRecurring: true,
      };
    } catch (error: any) {
      console.error(
        'Erro ao criar assinatura recorrente do Mercado Pago:',
        error,
      );

      // Cancelar subscription em caso de erro
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED' },
      });

      throw error;
    }
  }
}
