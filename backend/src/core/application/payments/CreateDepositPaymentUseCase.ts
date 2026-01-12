import { randomUUID } from 'crypto';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../../domain/entities/Payment';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentGateway } from '../../domain/gateways/PaymentGateway';
import { PlanResolverService } from '../../domain/plans/PlanResolverService';

export class CreateDepositPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly planResolver: PlanResolverService,
  ) {}

  async execute(input: {
    appointmentId: string;
    professionalId: string;
    totalPrice: number;
    depositPercent: number;
  }) {
    const amount = (input.totalPrice * input.depositPercent) / 100;

    const plan = await this.planResolver.resolveByOwner(input.professionalId);
    const platformFee = (amount * plan.platformFeePercent) / 100;
    const establishmentAmount = amount - platformFee;

    const payment = new Payment(
      randomUUID(),
      input.appointmentId,
      amount,
      PaymentType.DEPOSIT,
      platformFee,
      establishmentAmount,
      null,
      null,
      PaymentStatus.PENDING,
      new Date(),
      'PIX',
    );

    await this.paymentRepository.save(payment);

    const result = await this.paymentGateway.charge({
      paymentId: payment.id,
      amount: payment.amount,
      description: 'Sinal de agendamento',
    });

    if (result.success) {
      payment.transactionId = result.transactionId ?? null;
      payment.transferId = result.transferId ?? null;
      payment.markAsPaid();
    } else {
      payment.fail();
    }

    return payment;
  }
}
