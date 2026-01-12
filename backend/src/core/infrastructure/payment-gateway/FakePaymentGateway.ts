import { PaymentGateway } from '../../domain/gateways/PaymentGateway';

// Simple gateway stub that always succeeds; replace with Stripe/Pagar.me later.
export class FakePaymentGateway implements PaymentGateway {
  async charge(input: {
    paymentId: string;
    amount: number;
    description: string;
  }) {
    return {
      success: true,
      transactionId: `txn_${input.paymentId}`,
      transferId: `trf_${input.paymentId}`,
    };
  }

  async createPaymentLink(input: {
    amount: number;
    description: string;
    payerEmail: string;
    externalReference: string;
    platformFeePercent?: number;
    establishmentMercadoPagoId?: string;
  }) {
    const platformFee = (input.amount * (input.platformFeePercent || 10)) / 100;
    return {
      success: true,
      paymentUrl: `https://fake-payment.com/${input.externalReference}`,
      qrCode: 'fake-qr-code',
      qrCodeBase64: 'fake-qr-code-base64',
      platformFee,
      establishmentAmount: input.amount - platformFee,
    };
  }
}
