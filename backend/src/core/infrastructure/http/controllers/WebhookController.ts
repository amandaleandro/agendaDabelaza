import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma/PrismaService';
import { PaymentStatus } from '../../../domain/entities/Payment';

@Controller('webhooks')
export class WebhookController {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  }

  @Post('stripe')
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!endpointSecret) {
      console.warn(
        'STRIPE_WEBHOOK_SECRET not configured; skipping signature verification',
      );
    }

    if (!req.rawBody) {
      return { received: false };
    }

    let event: Stripe.Event;

    try {
      if (endpointSecret) {
        event = this.stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          endpointSecret,
        );
      } else {
        event = JSON.parse(req.rawBody as unknown as string) as Stripe.Event;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return { received: false };
    }

    // Handle payment intent completion
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata?.paymentId;

      if (paymentId) {
        await this.prisma.payment.updateMany({
          where: { id: paymentId },
          data: { status: PaymentStatus.PAID },
        });
        console.log(`Payment ${paymentId} marked as PAID`);
      }
    }

    // Handle payment intent failure
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata?.paymentId;

      if (paymentId) {
        await this.prisma.payment.updateMany({
          where: { id: paymentId },
          data: { status: PaymentStatus.FAILED },
        });
        console.log(`Payment ${paymentId} marked as FAILED`);
      }
    }

    return { received: true };
  }
}
