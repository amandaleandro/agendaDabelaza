import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma/PrismaService';
import { PlanType } from '../../domain/entities/Plan';

export interface CreateSubscriptionPaymentInput {
  establishmentId: string;
  ownerId: string;
  planType: PlanType;
}

export interface CreateSubscriptionPaymentOutput {
  paymentId: string;
  preferenceId: string;
  initPoint: string;
  subscriptionId: string;
  amount: number;
}

@Injectable()
export class CreateSubscriptionPaymentUseCase {
  constructor(private readonly prisma: PrismaService) {}

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

    // Criar assinatura pendente
    const subscription = await this.prisma.subscription.create({
      data: {
        id: randomUUID(),
        ownerId: input.ownerId,
        establishmentId: input.establishmentId,
        planType: input.planType,
        status: 'PENDING',
        startedAt: new Date(),
        expiresAt: null, // Será definido após pagamento
      },
    });

    // Configurar preferência do Mercado Pago
    const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!mercadoPagoToken) {
      console.warn('MERCADOPAGO_ACCESS_TOKEN não configurado - modo simulação');
      
      // Modo simulação: retornar dados fake
      return {
        paymentId: 'SIMULATED',
        preferenceId: 'SIMULATED_' + subscription.id,
        initPoint: `/admin/assinatura/payment-success?subscription_id=${subscription.id}`,
        subscriptionId: subscription.id,
        amount: amount,
      };
    }

    try {
      // Criar preferência no Mercado Pago
      const preferenceData = {
        items: [
          {
            title: `Plano ${input.planType} - Agendei`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: amount,
          },
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/assinatura/payment-success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/assinatura/payment-failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/assinatura/payment-pending`,
        },
        external_reference: subscription.id,
        notification_url: `${process.env.API_URL || 'http://localhost:3001'}/api/subscriptions/webhook/mercadopago`,
        metadata: {
          subscription_id: subscription.id,
          establishment_id: input.establishmentId,
          owner_id: input.ownerId,
        },
      };

      console.log('📤 Enviando preferência para Mercado Pago:', {
        items: preferenceData.items,
        back_urls: preferenceData.back_urls,
      });

      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
        body: JSON.stringify(preferenceData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Mercado Pago erro (${response.status}): ${errorText}`);
        throw new Error(`Erro Mercado Pago ${response.status}: ${errorText}`);
      }

      const preference = await response.json();

      console.log('✅ Preferência Mercado Pago criada com sucesso:', {
        preferenceId: preference.id,
        initPoint: preference.init_point,
      });

      return {
        paymentId: preference.id,
        preferenceId: preference.id,
        initPoint: preference.init_point,
        subscriptionId: subscription.id,
        amount: amount,
      };
    } catch (error: any) {
      console.error('Erro ao criar preferência do Mercado Pago:', error);
      
      // Cancelar subscription em caso de erro
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED' },
      });

      throw error;
    }
  }
}
