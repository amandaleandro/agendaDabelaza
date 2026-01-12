import { Injectable } from '@nestjs/common';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../../../domain/entities/Payment';
import { PaymentRepository } from '../../../domain/repositories/PaymentRepository';
import { PrismaService } from '../prisma/PrismaService';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });

    if (!row) return null;

    return new Payment(
      row.id,
      row.appointmentId,
      row.amount,
      row.type as PaymentType,
      row.platformFee,
      row.establishmentAmount,
      row.transactionId,
      row.transferId,
      row.status as PaymentStatus,
      row.createdAt,
      row.paymentMethod,
      row.paymentUrl,
      row.pixQrCode,
      row.pixQrCodeBase64,
      row.paidAt,
      row.updatedAt,
    );
  }

  async save(payment: Payment): Promise<void> {
    await this.prisma.payment.upsert({
      where: { appointmentId: payment.appointmentId },
      create: {
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
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      },
      update: {
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
        paidAt: payment.paidAt,
      },
    });
  }

  async findByAppointment(appointmentId: string): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(
      (row) =>
        new Payment(
          row.id,
          row.appointmentId,
          row.amount,
          row.type as PaymentType,
          row.platformFee,
          row.establishmentAmount,
          row.transactionId,
          row.transferId,
          row.status as PaymentStatus,
          row.createdAt,
          row.paymentMethod,
          row.paymentUrl,
          row.pixQrCode,
          row.pixQrCodeBase64,
          row.paidAt,
          row.updatedAt,
        ),
    );
  }

  async findAll(): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(
      (row) =>
        new Payment(
          row.id,
          row.appointmentId,
          row.amount,
          row.type as PaymentType,
          row.platformFee,
          row.establishmentAmount,
          row.transactionId,
          row.transferId,
          row.status as PaymentStatus,
          row.createdAt,
          row.paymentMethod,
          row.paymentUrl,
          row.pixQrCode,
          row.pixQrCodeBase64,
          row.paidAt,
          row.updatedAt,
        ),
    );
  }
}
