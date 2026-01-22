import { Injectable } from '@nestjs/common';

export interface MercadoPagoSubscriptionRequest {
  reason: string;
  auto_recurring: {
    frequency: number; // 1 para mensal
    frequency_type: string; // 'months'
    transaction_amount: number; // Valor da cobrança
    currency_id: string; // 'BRL'
  };
  payer_email: string;
  back_url: string;
  external_reference?: string;
}

export interface MercadoPagoSubscriptionResponse {
  id: string;
  reason: string;
  status: string;
  init_point: string;
  sandbox_init_point?: string;
  payer_email: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
  date_created: string;
  last_modified: string;
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
      'https://api.mercadopago.com/preapproval',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
        body: JSON.stringify(data),
      },
    );
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
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
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
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
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
