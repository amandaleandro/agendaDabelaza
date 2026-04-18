import { randomUUID } from 'crypto';
import { GetEstablishmentPlanUseCase } from '../subscriptions/GetEstablishmentPlanUseCase';
import { PaymentGateway } from '../../domain/gateways/PaymentGateway';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { Payment, PaymentStatus, PaymentType } from '../../domain/entities/Payment';

interface CreateAppointmentPaymentLinkInput {
  appointmentId: string;
  payerEmail: string;
  establishmentMercadoPagoId?: string;
  amountOverride?: number;
  descriptionOverride?: string;
  paymentType?: PaymentType;
}

interface CreateAppointmentPaymentLinkOutput {
  success: boolean;
  paymentUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  amount: number;
  platformFeePercent: number;
  platformFee: number;
  establishmentAmount: number;
}

export class CreateAppointmentPaymentLinkUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly getEstablishmentPlanUseCase: GetEstablishmentPlanUseCase,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(
    input: CreateAppointmentPaymentLinkInput,
  ): Promise<CreateAppointmentPaymentLinkOutput> {
    // Buscar agendamento
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Buscar plano do estabelecimento para calcular comissão
    const plan = await this.getEstablishmentPlanUseCase.execute(
      appointment.establishmentId,
    );

    // Criar link de pagamento com split payment automático
    const result = await this.paymentGateway.createPaymentLink({
      amount: input.amountOverride ?? appointment.price,
      description:
        input.descriptionOverride ||
        `Agendamento #${appointment.id.substring(0, 8)}`,
      payerEmail: input.payerEmail,
      externalReference: appointment.id,
      platformFeePercent: plan.platformFeePercent,
      establishmentMercadoPagoId: input.establishmentMercadoPagoId,
    });

    const amount = input.amountOverride ?? appointment.price;
    const platformFee = (amount * plan.platformFeePercent) / 100;
    const establishmentAmount = amount - platformFee;

    // Persiste pagamento pendente com link/QR
    const payment = new Payment(
      randomUUID(),
      appointment.id,
      amount,
      input.paymentType || PaymentType.FULL,
      platformFee,
      establishmentAmount,
      null,
      null,
      PaymentStatus.PENDING,
      new Date(),
      'CHECKOUT',
      result.paymentUrl || null,
      result.qrCode || null,
      result.qrCodeBase64 || null,
      null,
      null,
    );

    await this.paymentRepository.save(payment);

    return {
      success: result.success,
      paymentUrl: result.paymentUrl,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      amount,
      platformFeePercent: plan.platformFeePercent,
      platformFee,
      establishmentAmount,
    };
  }
}
