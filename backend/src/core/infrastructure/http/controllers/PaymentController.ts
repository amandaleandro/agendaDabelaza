import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateDepositPaymentUseCase } from '../../../application/payments/CreateDepositPaymentUseCase';
import { CreateDepositPaymentDto } from '../dtos/CreateDepositPaymentDto';
import { PrismaPaymentRepository } from '../../database/repositories/PrismaPaymentRepository';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../../../domain/entities/Payment';
import { randomUUID } from 'crypto';
import { CreatePaymentDto } from '../dtos/CreatePaymentDto';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createDepositPaymentUseCase: CreateDepositPaymentUseCase,
    private readonly paymentRepository: PrismaPaymentRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePaymentDto) {
    const payment = new Payment(
      randomUUID(),
      dto.appointmentId,
      dto.amount,
      PaymentType.FULL,
      0,
      dto.amount,
      null,
      null,
      PaymentStatus.PAID,
      new Date(),
      'CASH',
    );

    await this.paymentRepository.save(payment);

    return {
      id: payment.id,
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      type: payment.type,
      platformFee: payment.platformFee,
      establishmentAmount: payment.establishmentAmount,
      transactionId: payment.transactionId,
      transferId: payment.transferId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentUrl: payment.paymentUrl,
      pixQrCode: payment.pixQrCode,
      pixQrCodeBase64: payment.pixQrCodeBase64,
      createdAt: payment.createdAt.toISOString(),
    };
  }

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  async createDeposit(@Body() dto: CreateDepositPaymentDto) {
    const payment = await this.createDepositPaymentUseCase.execute({
      appointmentId: dto.appointmentId,
      professionalId: dto.professionalId,
      totalPrice: dto.totalPrice,
      depositPercent: dto.depositPercent,
    });

    return {
      id: payment.id,
      appointmentId: payment.appointmentId,
      type: payment.type,
      amount: payment.amount,
      platformFee: payment.platformFee,
      establishmentAmount: payment.establishmentAmount,
      transactionId: payment.transactionId,
      transferId: payment.transferId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentUrl: payment.paymentUrl,
      pixQrCode: payment.pixQrCode,
      pixQrCodeBase64: payment.pixQrCodeBase64,
      createdAt: payment.createdAt.toISOString(),
    };
  }

  @Get()
  async list() {
    const payments = await this.paymentRepository.findAll();

    return payments.map((payment) => ({
      id: payment.id,
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      type: payment.type,
      platformFee: payment.platformFee,
      establishmentAmount: payment.establishmentAmount,
      transactionId: payment.transactionId,
      transferId: payment.transferId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentUrl: payment.paymentUrl,
      pixQrCode: payment.pixQrCode,
      pixQrCodeBase64: payment.pixQrCodeBase64,
      createdAt: payment.createdAt.toISOString(),
    }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) return null;

    return {
      id: payment.id,
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      type: payment.type,
      platformFee: payment.platformFee,
      establishmentAmount: payment.establishmentAmount,
      transactionId: payment.transactionId,
      transferId: payment.transferId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentUrl: payment.paymentUrl,
      pixQrCode: payment.pixQrCode,
      pixQrCodeBase64: payment.pixQrCodeBase64,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}
