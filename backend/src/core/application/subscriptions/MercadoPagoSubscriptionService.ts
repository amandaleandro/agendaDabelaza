import { Injectable } from '@nestjs/common';

export interface MercadoPagoSubscriptionRequest {
  reason: string;
  auto_recurring: {
    frequency: number; // 1 para mensal
    frequency_type: string; // 'months'
  };
  payer_email: string;
  card_token_id?: string;
  payment_method_id?: 'debit_card' | 'credit_card';
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  external_reference?: string;
  notification_url?: string;
}

export interface MercadoPagoSubscriptionResponse {
  id: string;
  reason: string;
  status: string;
  init_point?: string;
  sandbox_init_point?: string;
  payer_email: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
  };
  first_invoice_date?: string;
  next_invoice_date?: string;
  subscription_sequence?: number;
}

@Injectable()
export class MercadoPagoSubscriptionService {
  async createSubscription(
    data: MercadoPagoSubscriptionRequest,
  ): Promise<MercadoPagoSubscriptionResponse> {
    const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!mercadoPagoToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    console.log('📤 Criando assinatura recorrente no Mercado Pago:', {
      reason: data.reason,
      payer_email: data.payer_email,
      auto_recurring: data.auto_recurring,
    });

    const response = await fetch(
      'https://api.mercadopago.com/v1/recurring_subscriptions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro ao criar assinatura no Mercado Pago:', errorData);
      throw new Error(
        `Mercado Pago API error: ${errorData.message || response.statusText}`,
      );
    }

    const subscription = await response.json();
    console.log('✅ Assinatura recorrente criada com sucesso:', subscription.id);

    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!mercadoPagoToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    console.log('📤 Cancelando assinatura no Mercado Pago:', subscriptionId);

    const response = await fetch(
      `https://api.mercadopago.com/v1/recurring_subscriptions/${subscriptionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        '❌ Erro ao cancelar assinatura no Mercado Pago:',
        errorData,
      );
      throw new Error(
        `Mercado Pago API error: ${errorData.message || response.statusText}`,
      );
    }

    console.log('✅ Assinatura cancelada com sucesso no Mercado Pago');
  }

  async getSubscription(
    subscriptionId: string,
  ): Promise<MercadoPagoSubscriptionResponse> {
    const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!mercadoPagoToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/recurring_subscriptions/${subscriptionId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        '❌ Erro ao buscar assinatura no Mercado Pago:',
        errorData,
      );
      throw new Error(
        `Mercado Pago API error: ${errorData.message || response.statusText}`,
      );
    }

    return await response.json();
  }
}
