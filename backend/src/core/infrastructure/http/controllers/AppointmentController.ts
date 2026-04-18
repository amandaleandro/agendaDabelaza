import {
  Body,
  Controller,
  BadRequestException,
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
              },
            },
          },
        },
        payment: true,
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
      items: apt.items.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        createdAt: item.createdAt.toISOString(),
        product: item.product,
      })),
      serviceItems: apt.serviceItems.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: item.price,
        createdAt: item.createdAt.toISOString(),
        service: item.service,
      })),
      payment: apt.payment
        ? {
            id: apt.payment.id,
            appointmentId: apt.payment.appointmentId,
            amount: apt.payment.amount,
            type: apt.payment.type,
            status: apt.payment.status,
            paymentMethod: apt.payment.paymentMethod,
            paidAt: apt.payment.paidAt?.toISOString() ?? null,
            createdAt: apt.payment.createdAt.toISOString(),
          }
        : null,
      totals: this.buildTotals(apt),
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

  @Get('professional/:professionalId')
  async listByProfessional(@Param('professionalId') professionalId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { professionalId },
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
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

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
      user: appointment.user,
      service: appointment.service,
      items: appointment.items.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        createdAt: item.createdAt.toISOString(),
        product: item.product,
      })),
      serviceItems: appointment.serviceItems.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: item.price,
        createdAt: item.createdAt.toISOString(),
        service: item.service,
      })),
      payment: appointment.payment
        ? {
            id: appointment.payment.id,
            appointmentId: appointment.payment.appointmentId,
            amount: appointment.payment.amount,
            type: appointment.payment.type,
            status: appointment.payment.status,
            paymentMethod: appointment.payment.paymentMethod,
            paidAt: appointment.payment.paidAt?.toISOString() ?? null,
            createdAt: appointment.payment.createdAt.toISOString(),
          }
        : null,
      totals: this.buildTotals(appointment),
    }));
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
              },
            },
          },
        },
        payment: true,
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
      items: appointment.items.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        createdAt: item.createdAt.toISOString(),
        product: item.product,
      })),
      serviceItems: appointment.serviceItems.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: item.price,
        createdAt: item.createdAt.toISOString(),
        service: item.service,
      })),
      payment: appointment.payment
        ? {
            id: appointment.payment.id,
            appointmentId: appointment.payment.appointmentId,
            amount: appointment.payment.amount,
            type: appointment.payment.type,
            status: appointment.payment.status,
            paymentMethod: appointment.payment.paymentMethod,
            paidAt: appointment.payment.paidAt?.toISOString() ?? null,
            createdAt: appointment.payment.createdAt.toISOString(),
          }
        : null,
      totals: this.buildTotals(appointment),
    };
  }

  @Post(':id/service-items')
  @HttpCode(HttpStatus.CREATED)
  async addServiceItem(
    @Param('id') appointmentId: string,
    @Body() body: { serviceId?: string; quantity?: number },
  ) {
    const quantity = body.quantity ?? 1;
    if (!body.serviceId) {
      throw new BadRequestException('serviceId is required');
    }

    if (quantity <= 0) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { professionalId: true, status: true },
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    if (!['SCHEDULED', 'PAYMENT_PENDING'].includes(appointment.status)) {
      throw new BadRequestException('Only active appointments can receive extra services');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: body.serviceId },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
        professionalId: true,
      },
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    if (service.professionalId !== appointment.professionalId) {
      throw new BadRequestException('Service does not belong to this professional');
    }

    const item = await this.prisma.appointmentServiceItem.create({
      data: {
        appointmentId,
        serviceId: service.id,
        quantity,
        price: service.price,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
      },
    });

    return {
      id: item.id,
      appointmentId: item.appointmentId,
      serviceId: item.serviceId,
      quantity: item.quantity,
      price: item.price,
      createdAt: item.createdAt.toISOString(),
      service: item.service,
    };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id') appointmentId: string,
    @Body() body: { paymentMethod?: string },
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        items: true,
        serviceItems: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    if (appointment.status !== 'SCHEDULED') {
      throw new BadRequestException('Only scheduled appointments can be completed');
    }

    const basePrice = appointment.price;
    const productsTotal = appointment.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const servicesTotal = appointment.serviceItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const total = basePrice + productsTotal + servicesTotal;
    const amountPaid =
      appointment.payment?.status === 'PAID' ? appointment.payment.amount : 0;
    const remaining = Math.max(total - amountPaid, 0);

    if (remaining > 0 && !body.paymentMethod) {
      throw new BadRequestException(
        'There is an outstanding balance. Inform paymentMethod to complete the service.',
      );
    }

    if (body.paymentMethod) {
      const now = new Date();
      if (appointment.payment) {
        await this.prisma.payment.update({
          where: { id: appointment.payment.id },
          data: {
            amount: total,
            status: 'PAID',
            type: remaining > 0 ? 'FULL' : appointment.payment.type,
            paymentMethod: body.paymentMethod,
            paidAt: now,
            updatedAt: now,
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            appointmentId,
            amount: total,
            establishmentAmount: total,
            platformFee: 0,
            type: 'FULL',
            status: 'PAID',
            paymentMethod: body.paymentMethod,
            paidAt: now,
          },
        });
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
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
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      payment: updated.payment
        ? {
            id: updated.payment.id,
            appointmentId: updated.payment.appointmentId,
            amount: updated.payment.amount,
            type: updated.payment.type,
            status: updated.payment.status,
            paymentMethod: updated.payment.paymentMethod,
            paidAt: updated.payment.paidAt?.toISOString() ?? null,
            createdAt: updated.payment.createdAt.toISOString(),
          }
        : null,
      totals: this.buildTotals(updated),
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

  private buildTotals(appointment: {
    price: number;
    items?: Array<{ price: number; quantity: number }>;
    serviceItems?: Array<{ price: number; quantity: number }>;
    payment?: { status: string; amount: number } | null;
  }) {
    const basePrice = appointment.price ?? 0;
    const productsTotal =
      appointment.items?.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ) ?? 0;
    const servicesTotal =
      appointment.serviceItems?.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ) ?? 0;
    const total = basePrice + productsTotal + servicesTotal;
    const amountPaid =
      appointment.payment?.status === 'PAID' ? appointment.payment.amount : 0;

    return {
      basePrice,
      productsTotal,
      servicesTotal,
      total,
      amountPaid,
      remaining: Math.max(total - amountPaid, 0),
    };
  }
}
