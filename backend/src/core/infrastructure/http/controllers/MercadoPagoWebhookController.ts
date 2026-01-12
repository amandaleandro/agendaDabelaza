import { Controller, Post, Body, Headers, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { MercadoPagoGateway } from '../../payment-gateway/MercadoPagoGateway';
import { PrismaService } from '../../database/prisma/PrismaService';

/**
 * Controller para receber webhooks do Mercado Pago
 * Processa notificações de mudança de status de pagamento
 */
@Controller('webhooks/mercadopago')
export class MercadoPagoWebhookController {
  constructor(
    private readonly mercadoPagoGateway: MercadoPagoGateway,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Endpoint que recebe notificações do Mercado Pago
   * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
   */
  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Res() res: Response,
  ) {
    try {
      console.log('📨 Webhook do Mercado Pago recebido:', {
        type: body.type,
        action: body.action,
        data: body.data,
        requestId,
      });

      // Verifica se é uma notificação de pagamento
      if (body.type === 'payment') {
        const paymentId = body.data?.id;

        if (!paymentId) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            error: 'Payment ID not found in webhook data',
          });
        }

        // Consulta o status atualizado do pagamento
        const paymentStatus = await this.mercadoPagoGateway.getPaymentStatus(
          paymentId.toString(),
        );

        if (!paymentStatus) {
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to get payment status',
          });
        }

        console.log('💳 Status do pagamento:', paymentStatus);

        // Atualiza o status do pagamento no banco de dados
        // Busca pelo transactionId (que é o payment ID do Mercado Pago)
        const payment = await this.prisma.payment.findFirst({
          where: {
            transactionId: paymentId.toString(),
          },
        });

        if (payment) {
          // Mapeia o status do Mercado Pago para o status interno
          let status = payment.status;
          
          if (paymentStatus.status === 'approved') {
            status = 'PAID';
          } else if (paymentStatus.status === 'rejected') {
            status = 'FAILED';
          } else if (paymentStatus.status === 'cancelled') {
            status = 'FAILED';
          } else if (paymentStatus.status === 'pending') {
            status = 'PENDING';
          }

          // Atualiza o pagamento
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status,
              updatedAt: new Date(),
            },
          });

          console.log('✅ Pagamento atualizado:', {
            paymentId: payment.id,
            oldStatus: payment.status,
            newStatus: status,
          });
        } else {
          console.warn('⚠️  Pagamento não encontrado no banco:', paymentId);
        }
      }

      // Retorna 200 para confirmar recebimento do webhook
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook do Mercado Pago:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error',
      });
    }
  }
}
