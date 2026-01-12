import { PaymentGateway } from '../../domain/gateways/PaymentGateway';
import { MercadoPagoConfig, Payment } from 'mercadopago';

/**
 * Gateway de pagamento integrado com Mercado Pago
 * Processa pagamentos usando a API do Mercado Pago
 */
export class MercadoPagoGateway implements PaymentGateway {
  private client: Payment;

  constructor() {
    // Inicializa o cliente do Mercado Pago com o Access Token
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.warn('⚠️  MERCADOPAGO_ACCESS_TOKEN não configurado. Usando modo de teste.');
    }

    const config = new MercadoPagoConfig({
      accessToken: accessToken || 'TEST-ACCESS-TOKEN',
      options: {
        timeout: 5000,
      }
    });

    this.client = new Payment(config);
  }

  /**
   * Processa um pagamento via Mercado Pago
   * @param input - Dados do pagamento (paymentId, amount, description)
   * @returns Resultado do pagamento com transactionId
   */
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
      // Cria um pagamento no Mercado Pago
      const payment = await this.client.create({
        body: {
          transaction_amount: input.amount,
          description: input.description,
          payment_method_id: 'pix', // PIX como método padrão
          payer: {
            email: 'cliente@example.com', // TODO: Passar email real do cliente
          },
          // Metadata personalizada para rastreamento
          external_reference: input.paymentId,
          notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
        }
      });

      // Verifica se o pagamento foi criado com sucesso
      if (payment.id) {
        return {
          success: true,
          transactionId: payment.id.toString(),
          transferId: payment.external_reference || undefined,
        };
      }

      return {
        success: false,
      };
    } catch (error: any) {
      console.error('Erro ao processar pagamento no Mercado Pago:', error);
      
      // Em caso de erro, retorna falha
      return {
        success: false,
      };
    }
  }

  /**
   * Cria um link de pagamento para o cliente com split payment
   * O valor é dividido entre o estabelecimento (90%) e a plataforma (10%)
   * @param input.amount - Valor total do serviço
   * @param input.platformFeePercent - Percentual da plataforma (padrão: 10%)
   * @param input.establishmentMercadoPagoId - ID da conta MP do estabelecimento
   */
  async createPaymentLink(input: {
    amount: number;
    description: string;
    payerEmail: string;
    externalReference: string;
    platformFeePercent?: number; // Percentual da plataforma (ex: 10 = 10%)
    establishmentMercadoPagoId?: string; // Conta MP do estabelecimento
  }): Promise<{
    success: boolean;
    paymentUrl?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    platformFee?: number;
    establishmentAmount?: number;
  }> {
    try {
      const feePercent = input.platformFeePercent || 10; // Padrão: 10%
      const platformFee = (input.amount * feePercent) / 100;
      const establishmentAmount = input.amount - platformFee;

      // Configura split payment se houver
      const splitConfig = input.establishmentMercadoPagoId
        ? {
            // Split: Plataforma fica com X% 
            application_fee: platformFee,
            // Conta destino (estabelecimento recebe os outros Y%)
            marketplace: input.establishmentMercadoPagoId,
          }
        : {};

      const payment = await this.client.create({
        body: {
          transaction_amount: input.amount,
          description: input.description,
          payment_method_id: 'pix',
          payer: {
            email: input.payerEmail,
          },
          external_reference: input.externalReference,
          notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
          ...splitConfig,
        }
      });

      if (payment.id && payment.point_of_interaction?.transaction_data) {
        return {
          success: true,
          paymentUrl: payment.point_of_interaction.transaction_data.ticket_url,
          qrCode: payment.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
          platformFee,
          establishmentAmount,
        };
      }

      return {
        success: false,
      };
    } catch (error: any) {
      console.error('Erro ao criar link de pagamento:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    statusDetail?: string;
  } | null> {
    try {
      const payment = await this.client.get({ id: paymentId });
      
      return {
        status: payment.status || 'unknown',
        statusDetail: payment.status_detail || undefined,
      };
    } catch (error: any) {
      console.error('Erro ao consultar status do pagamento:', error);
      return null;
    }
  }
}
