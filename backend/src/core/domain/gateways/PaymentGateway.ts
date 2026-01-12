export interface PaymentGateway {
  charge(input: {
    paymentId: string;
    amount: number;
    description: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    transferId?: string;
  }>;

  createPaymentLink(input: {
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
  }>;
}
