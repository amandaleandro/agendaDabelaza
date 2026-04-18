import { Body, Controller, Headers, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma/PrismaService';
import { MercadoPagoGateway } from '../../payment-gateway/MercadoPagoGateway';
import { WhatsAppBaileysService } from '../../whatsapp/WhatsAppBaileysService';

@Controller('webhooks/mercadopago')
export class MercadoPagoWebhookController {
  constructor(
    private readonly mercadoPagoGateway: MercadoPagoGateway,
    private readonly prisma: PrismaService,
    private readonly whatsAppBaileysService: WhatsAppBaileysService,
  ) {}

  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature') _signature: string,
    @Headers('x-request-id') requestId: string,
    @Res() res: Response,
  ) {
    try {
      console.log('Webhook do Mercado Pago recebido:', {
        type: body.type,
        action: body.action,
        data: body.data,
        requestId,
      });

      if (body.type !== 'payment') {
        return res.status(HttpStatus.OK).json({ success: true });
      }

      const mercadoPagoPaymentId = body.data?.id;
      if (!mercadoPagoPaymentId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Payment ID not found in webhook data',
        });
      }

      const paymentStatus = await this.mercadoPagoGateway.getPaymentStatus(
        mercadoPagoPaymentId.toString(),
      );

      if (!paymentStatus) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to get payment status',
        });
      }

      const payment = await this.prisma.payment.findFirst({
        where: {
          OR: [
            { transactionId: mercadoPagoPaymentId.toString() },
            paymentStatus.externalReference
              ? { appointmentId: paymentStatus.externalReference }
              : { appointmentId: '__no_appointment__' },
          ],
        },
      });

      if (!payment) {
        console.warn('Pagamento nao encontrado no banco:', mercadoPagoPaymentId);
        return res.status(HttpStatus.OK).json({ success: true });
      }

      let status = payment.status;
      if (paymentStatus.status === 'approved') {
        status = 'PAID';
      } else if (
        paymentStatus.status === 'rejected' ||
        paymentStatus.status === 'cancelled'
      ) {
        status = 'FAILED';
      } else if (paymentStatus.status === 'pending') {
        status = 'PENDING';
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          transactionId: mercadoPagoPaymentId.toString(),
          paidAt: status === 'PAID' ? new Date() : payment.paidAt,
          updatedAt: new Date(),
        },
      });

      if (status === 'PAID') {
        const appointment = await this.prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: 'SCHEDULED',
            holdExpiresAt: null,
          },
          include: {
            user: true,
            professional: true,
            service: true,
            establishment: true,
          },
        });

        if (appointment.user.phone) {
          await this.whatsAppBaileysService.sendDirectMessage(
            appointment.user.phone,
            [
              'Pagamento aprovado com sucesso.',
              `Seu agendamento esta confirmado para ${appointment.establishment.name}.`,
              `Servico: ${appointment.service.name}`,
              `Profissional: ${appointment.professional.name}`,
              `Quando: ${appointment.scheduledAt.toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}`,
              `Codigo: ${appointment.id}`,
            ].join('\n'),
          );
        }
      }

      if (status === 'FAILED') {
        await this.prisma.appointment.updateMany({
          where: {
            id: payment.appointmentId,
            status: 'PAYMENT_PENDING',
          },
          data: {
            status: 'CANCELLED',
            holdExpiresAt: null,
          },
        });
      }

      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      console.error('Erro ao processar webhook do Mercado Pago:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error',
      });
    }
  }
}
