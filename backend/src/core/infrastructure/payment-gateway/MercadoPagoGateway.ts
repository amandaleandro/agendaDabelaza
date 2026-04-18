import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PaymentGateway } from '../../domain/gateways/PaymentGateway';

export class MercadoPagoGateway implements PaymentGateway {
  private paymentClient: Payment;
  private preferenceClient: Preference;

  constructor() {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      console.warn(
        'MERCADOPAGO_ACCESS_TOKEN nao configurado. Usando modo de teste.',
      );
    }

    const config = new MercadoPagoConfig({
      accessToken: accessToken || 'TEST-ACCESS-TOKEN',
      options: {
        timeout: 5000,
      },
    });

    this.paymentClient = new Payment(config);
    this.preferenceClient = new Preference(config);
  }

  async charge(input: {
    paymentId: string;
    amount: number;
    description: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    transferId?: string;
  }> {
    try {
      const payment = await this.paymentClient.create({
        body: {
          transaction_amount: input.amount,
          description: input.description,
          payment_method_id: 'pix',
          payer: {
            email: 'cliente@example.com',
          },
          external_reference: input.paymentId,
          notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
        },
      });

      if (!payment.id) {
        return { success: false };
      }

      return {
        success: true,
        transactionId: payment.id.toString(),
        transferId: payment.external_reference || undefined,
      };
    } catch (error) {
      console.error('Erro ao processar pagamento no Mercado Pago:', error);
      return { success: false };
    }
  }

  async createPaymentLink(input: {
    amount: number;
    description: string;
    payerEmail: string;
    externalReference: string;
    platformFeePercent?: number;
    establishmentMercadoPagoId?: string;
  }): Promise<{
    success: boolean;
    paymentUrl?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    platformFee?: number;
    establishmentAmount?: number;
  }> {
    try {
      const feePercent = input.platformFeePercent || 10;
      const platformFee = (input.amount * feePercent) / 100;
      const establishmentAmount = input.amount - platformFee;

      const splitConfig = input.establishmentMercadoPagoId
        ? {
            application_fee: platformFee,
            marketplace: input.establishmentMercadoPagoId,
          }
        : {};

      const preference = await this.preferenceClient.create({
        body: {
          items: [
            {
              id: input.externalReference,
              title: input.description,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: Number(input.amount.toFixed(2)),
            },
          ],
          payer: {
            email: input.payerEmail,
          },
          external_reference: input.externalReference,
          notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
          back_urls: {
            success: process.env.MERCADOPAGO_SUCCESS_URL,
            pending: process.env.MERCADOPAGO_PENDING_URL,
            failure: process.env.MERCADOPAGO_FAILURE_URL,
          },
          auto_return: 'approved',
          payment_methods: {
            excluded_payment_types: [],
            installments: 12,
          },
          ...splitConfig,
        },
      });

      if (!preference.id) {
        return { success: false };
      }

      return {
        success: true,
        paymentUrl: preference.init_point || preference.sandbox_init_point || undefined,
        platformFee,
        establishmentAmount,
      };
    } catch (error) {
      console.error('Erro ao criar link de pagamento:', error);
      return { success: false };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    statusDetail?: string;
    externalReference?: string;
  } | null> {
    try {
      const payment = await this.paymentClient.get({ id: paymentId });

      return {
        status: payment.status || 'unknown',
        statusDetail: payment.status_detail || undefined,
        externalReference: payment.external_reference || undefined,
      };
    } catch (error) {
      console.error('Erro ao consultar status do pagamento:', error);
      return null;
    }
  }
}
