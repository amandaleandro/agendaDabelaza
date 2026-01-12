import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';
import { randomUUID } from 'crypto';

@Controller('refunds')
export class RefundController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string) {
    const refunds = await this.prisma.refund.findMany({
      where: {
        appointment: {
          userId,
        },
      },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: {
              select: {
                name: true,
              },
            },
            professional: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return refunds;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            price: true,
            service: {
              select: {
                name: true,
              },
            },
            professional: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return refund;
  }

  @Post('request')
  async requestRefund(@Body() body: { appointmentId: string; reason: string }) {
    const { appointmentId, reason } = body;

    // Verificar se agendamento existe
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { user: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verificar se já existe reembolso para este agendamento
    const existingRefund = await this.prisma.refund.findFirst({
      where: {
        appointmentId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingRefund) {
      throw new BadRequestException('There is already a pending refund request for this appointment');
    }

    // Validar data do agendamento
    const appointmentDate = new Date(appointment.scheduledAt);
    const now = new Date();
    const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = appointment.price;
    let refundReason = reason;

    // Se cancelar com menos de 24h, reembolso de 70%
    if (hoursUntil < 24) {
      refundAmount = appointment.price * 0.7;
      refundReason = `${reason} (Reembolso 70% - Cancelamento com menos de 24h)`;
    }

    // Criar reembolso
    const refund = await this.prisma.refund.create({
      data: {
        id: randomUUID(),
        appointmentId,
        amount: refundAmount,
        reason: refundReason,
        status: 'PENDING',
      },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: {
              select: {
                name: true,
              },
            },
            professional: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return refund;
  }

  @Post(':id/approve')
  async approveRefund(@Param('id') id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== 'PENDING') {
      throw new BadRequestException('Only pending refunds can be approved');
    }

    const updated = await this.prisma.refund.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: {
              select: {
                name: true,
              },
            },
            professional: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  @Post(':id/reject')
  async rejectRefund(@Param('id') id: string, @Body() body: { reason?: string }) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== 'PENDING') {
      throw new BadRequestException('Only pending refunds can be rejected');
    }

    const updated = await this.prisma.refund.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        reason: body.reason ? `${refund.reason} (Rejeitado: ${body.reason})` : refund.reason,
      },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: {
              select: {
                name: true,
              },
            },
            professional: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  @Post(':id/complete')
  async completeRefund(@Param('id') id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== 'APPROVED') {
      throw new BadRequestException('Only approved refunds can be completed');
    }

    const updated = await this.prisma.refund.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: {
              select: {
                name: true,
              },
            },
            professional: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }
}
