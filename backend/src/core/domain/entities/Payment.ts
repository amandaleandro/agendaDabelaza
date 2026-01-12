export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentType {
  FULL = 'FULL',
  DEPOSIT = 'DEPOSIT', // sinal
  CANCELLATION_FEE = 'CANCELLATION_FEE',
}

export class Payment {
  constructor(
    public readonly id: string,
    public readonly appointmentId: string,
    public readonly amount: number,
    public readonly type: PaymentType,
    public platformFee: number,
    public establishmentAmount: number,
    public transactionId: string | null,
    public transferId: string | null,
    public status: PaymentStatus,
    public readonly createdAt: Date,
    public paymentMethod: string | null = null,
    public paymentUrl: string | null = null,
    public pixQrCode: string | null = null,
    public pixQrCodeBase64: string | null = null,
    public paidAt: Date | null = null,
    public updatedAt: Date | null = null,
  ) {}

  markAsPaid() {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payments can be paid');
    }
    this.status = PaymentStatus.PAID;
    this.paidAt = new Date();
  }

  fail() {
    this.status = PaymentStatus.FAILED;
  }
}
