import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { CreateAppointmentUseCase } from '../../../application/appointments/CreateAppointmentUseCase';
import { CancelAppointmentUseCase } from '../../../application/appointments/CancelAppointmentUseCase';
import { CreateAppointmentPaymentLinkUseCase } from '../../../application/appointments/CreateAppointmentPaymentLinkUseCase';
import { CreateAppointmentDto } from '../dtos/CreateAppointmentDto';
import { randomUUID } from 'crypto';
import { PrismaAppointmentRepository } from '../../database/repositories/PrismaAppointmentRepository';
import { CreateDepositPaymentUseCase } from '../../../application/payments/CreateDepositPaymentUseCase';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly createAppointmentPaymentLinkUseCase: CreateAppointmentPaymentLinkUseCase,
    private readonly appointmentRepository: PrismaAppointmentRepository,
    private readonly createDepositPaymentUseCase: CreateDepositPaymentUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAppointmentDto) {
    const appointment = await this.createAppointmentUseCase.execute({
      id: randomUUID(),
      userId: dto.userId,
      establishmentId: dto.establishmentId,
      professionalId: dto.professionalId,
      serviceId: dto.serviceId,
      scheduledAt: new Date(dto.scheduledAt),
    });

    let depositPayment: any = null;

    if (dto.depositPercent) {
      depositPayment = await this.createDepositPaymentUseCase.execute({
        appointmentId: appointment.id,
        professionalId: appointment.professionalId,
        totalPrice: appointment.price,
        depositPercent: dto.depositPercent,
      });
    }

    return {
      id: appointment.id,
      userId: appointment.userId,
      establishmentId: appointment.establishmentId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      scheduledAt: appointment.scheduledAt.toISOString(),
      status: appointment.status,
      price: appointment.price,
      createdAt: appointment.createdAt.toISOString(),
      depositPayment: depositPayment
        ? {
            id: depositPayment.id,
            appointmentId: depositPayment.appointmentId,
            type: depositPayment.type,
            amount: depositPayment.amount,
            platformFee: depositPayment.platformFee,
            establishmentAmount: depositPayment.establishmentAmount,
            transactionId: depositPayment.transactionId,
            transferId: depositPayment.transferId,
            status: depositPayment.status,
            createdAt: depositPayment.createdAt.toISOString(),
          }
        : null,
    };
  }

  @Get()
  async list() {
    const appointments = await this.prisma.appointment.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
        professional: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      scheduledAt: apt.scheduledAt.toISOString(),
      status: apt.status,
      price: apt.price,
      durationMinutes: apt.durationMinutes,
      serviceId: apt.serviceId,
      professionalId: apt.professionalId,
      createdAt: apt.createdAt.toISOString(),
      service: apt.service,
      professional: apt.professional,
      user: apt.user,
    }));
  }

  @Get('user/:userId')
  async listByUser(@Param('userId') userId: string) {
    const appointments = await this.appointmentRepository.findByUser(userId);

    return appointments.map((appointment) => ({
      id: appointment.id,
      userId: appointment.userId,
      establishmentId: appointment.establishmentId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      scheduledAt: appointment.scheduledAt.toISOString(),
      status: appointment.status,
      price: appointment.price,
      durationMinutes: appointment.durationMinutes,
      createdAt: appointment.createdAt.toISOString(),
    }));
  }

  @Get('client/:clientId')
  async listByClient(@Param('clientId') clientId: string) {
    return this.listByUser(clientId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
        professional: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!appointment) return null;

    return {
      id: appointment.id,
      scheduledAt: appointment.scheduledAt.toISOString(),
      status: appointment.status,
      price: appointment.price,
      durationMinutes: appointment.durationMinutes,
      serviceId: appointment.serviceId,
      professionalId: appointment.professionalId,
      createdAt: appointment.createdAt.toISOString(),
      service: appointment.service,
      professional: appointment.professional,
      user: appointment.user,
    };
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    const result = await this.cancelAppointmentUseCase.execute({
      appointmentId: id,
      now: new Date(),
    });

    return {
      status: 'CANCELLED',
      fee: result.fee,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.cancelAppointmentUseCase.execute({
      appointmentId: id,
      now: new Date(),
    });

    return {
      status: 'CANCELLED',
      fee: result.fee,
    };
  }

  @Post(':id/payment-link')
  @HttpCode(HttpStatus.OK)
  async createPaymentLink(
    @Param('id') appointmentId: string,
    @Body() body: { payerEmail: string; establishmentMercadoPagoId?: string },
  ) {
    const result = await this.createAppointmentPaymentLinkUseCase.execute({
      appointmentId,
      payerEmail: body.payerEmail,
      establishmentMercadoPagoId: body.establishmentMercadoPagoId,
    });

    return {
      success: result.success,
      paymentUrl: result.paymentUrl,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      amount: result.amount,
      platformFeePercent: result.platformFeePercent,
      platformFee: result.platformFee,
      establishmentAmount: result.establishmentAmount,
    };
  }
}
