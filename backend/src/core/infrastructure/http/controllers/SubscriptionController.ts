import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateSubscriptionUseCase } from '../../../application/subscriptions/CreateSubscriptionUseCase';
import { CancelSubscriptionUseCase } from '../../../application/subscriptions/CancelSubscriptionUseCase';
import { GetEstablishmentPlanUseCase } from '../../../application/subscriptions/GetEstablishmentPlanUseCase';
import { CreateSubscriptionPaymentUseCase } from '../../../application/subscriptions/CreateSubscriptionPaymentUseCase';
import { ProcessSubscriptionPaymentUseCase } from '../../../application/subscriptions/ProcessSubscriptionPaymentUseCase';
import { CheckSubscriptionStatusUseCase } from '../../../application/subscriptions/CheckSubscriptionStatusUseCase';
import { ProcessRecurringPaymentUseCase } from '../../../application/subscriptions/ProcessRecurringPaymentUseCase';
import { CancelRecurringSubscriptionUseCase } from '../../../application/subscriptions/CancelRecurringSubscriptionUseCase';
import { CreateSubscriptionDto } from '../dtos/CreateSubscriptionDto';
import { PrismaSubscriptionRepository } from '../../database/repositories/PrismaSubscriptionRepository';
import { PlanType } from '../../../domain/entities/Plan';
import { PrismaService } from '../../database/prisma/PrismaService';

// Configuração dos planos disponíveis
const PLAN_CONFIG = {
  FREE: {
    name: 'FREE',
    price: 0,
    platformFeePercent: 10,
    features: [
      'Até 2 profissionais',
      'Agendamento online ilimitado',
      'Gestão de clientes',
      'Relatórios básicos',
      'Suporte por email',
    ],
  },
  BASIC: {
    name: 'BASIC',
    price: 49.90,
    platformFeePercent: 5,
    features: [
      'Até 5 profissionais',
      'Tudo do FREE +',
      'Landing page customizada',
      'Relatórios avançados',
      'Lembretes por WhatsApp',
      'Suporte prioritário',
    ],
  },
  PRO: {
    name: 'PRO',
    price: 99.90,
    platformFeePercent: 0,
    features: [
      'Profissionais ilimitados',
      'Tudo do BASIC +',
      'Sem comissão! 🎉',
      'Gestão de estoque',
      'Vendas de produtos',
      'Integração com Instagram',
      'Suporte 24/7',
    ],
    popular: true,
  },
  PREMIUM: {
    name: 'PREMIUM',
    price: 199.90,
    platformFeePercent: 0,
    features: [
      'Múltiplas unidades',
      'Tudo do PRO +',
      'Sem comissão! 🎉',
      'App personalizado',
      'Relatórios empresariais',
      'Gerente de conta dedicado',
      'Onboarding personalizado',
    ],
  },
};

@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly getEstablishmentPlanUseCase: GetEstablishmentPlanUseCase,
    private readonly createSubscriptionPaymentUseCase: CreateSubscriptionPaymentUseCase,
    private readonly processSubscriptionPaymentUseCase: ProcessSubscriptionPaymentUseCase,
    private readonly checkSubscriptionStatusUseCase: CheckSubscriptionStatusUseCase,
    private readonly processRecurringPaymentUseCase: ProcessRecurringPaymentUseCase,
    private readonly cancelRecurringSubscriptionUseCase: CancelRecurringSubscriptionUseCase,
    private readonly subscriptionRepository: PrismaSubscriptionRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list() {
    const subscriptions = await this.subscriptionRepository.findAll();

    return subscriptions.map((sub) => ({
      id: sub.id,
      ownerId: sub.ownerId,
      planType: sub.planType,
      status: sub.status,
      startedAt: sub.startedAt.toISOString(),
      expiresAt: sub.expiresAt?.toISOString() ?? null,
    }));
  }

  // ==================== ENDPOINTS DE PLANOS ====================

  @Get('plans')
  async getPlans() {
    return {
      plans: Object.entries(PLAN_CONFIG).map(([id, config]) => ({
        id,
        ...config,
      })),
    };
  }

  @Get('establishment/:establishmentId')
  async getEstablishmentPlan(@Param('establishmentId') establishmentId: string) {
    const plan = await this.getEstablishmentPlanUseCase.execute(establishmentId);
    
    // Buscar assinatura ativa para pegar dados de expiração
    const subscription = await this.subscriptionRepository.findByEstablishmentId(establishmentId);
    
    return {
      planType: plan.planType,
      platformFeePercent: plan.platformFeePercent,
      monthlyPrice: plan.monthlyPrice,
      hasCommission: plan.hasCommission,
      features: PLAN_CONFIG[plan.planType]?.features || [],
      expiresAt: subscription?.expiresAt?.toISOString() || null,
      status: subscription?.status || 'ACTIVE',
    };
  }

  @Get('owner/:ownerId/status')
  async getOwnerSubscriptionStatus(@Param('ownerId') ownerId: string) {
    const status = await this.checkSubscriptionStatusUseCase.execute(ownerId);
    return status;
  }

  // ==================== ENDPOINTS GENÉRICOS ====================

  @Get(':id')
  async get(@Param('id') id: string) {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) return null;

    return {
      id: subscription.id,
      ownerId: subscription.ownerId,
      planType: subscription.planType,
      status: subscription.status,
      startedAt: subscription.startedAt.toISOString(),
      expiresAt: subscription.expiresAt?.toISOString() ?? null,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSubscriptionDto) {
    const subscription = await this.createSubscriptionUseCase.execute({
      ownerId: dto.ownerId,
      establishmentId: dto.establishmentId,
      planType: dto.planType,
    });

    return {
      id: subscription.id,
      ownerId: subscription.ownerId,
      planType: subscription.planType,
      status: subscription.status,
      startedAt: subscription.startedAt.toISOString(),
      expiresAt: subscription.expiresAt?.toISOString() || null,
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    const result = await this.cancelSubscriptionUseCase.execute({
      subscriptionId: id,
    });
    return result;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.cancelSubscriptionUseCase.execute({
      subscriptionId: id,
    });
    return result;
  }

  @Post('establishment/:establishmentId/plan')
  @HttpCode(HttpStatus.OK)
  async changePlan(
    @Param('establishmentId') establishmentId: string,
    @Body() body: { planType: PlanType; ownerId: string },
  ) {
    const validPlanTypes = [PlanType.FREE, PlanType.BASIC, PlanType.PRO, PlanType.PREMIUM];
    
    if (!validPlanTypes.includes(body.planType)) {
      return {
        success: false,
        message: 'Tipo de plano inválido',
      };
    }

    // Cancela assinatura atual (se existir)
    const existingSubscription = await this.subscriptionRepository.findByOwnerId(body.ownerId);
    if (existingSubscription) {
      await this.cancelSubscriptionUseCase.execute({
        subscriptionId: existingSubscription.id,
      });
    }

    // Cria nova assinatura com o plano escolhido
    const newSubscription = await this.createSubscriptionUseCase.execute({
      ownerId: body.ownerId,
      establishmentId: establishmentId,
      planType: body.planType,
    });

    const planConfig = PLAN_CONFIG[body.planType];

    return {
      success: true,
      message: `Plano ${body.planType} ativado com sucesso!`,
      subscription: {
        id: newSubscription.id,
        planType: newSubscription.planType,
        status: newSubscription.status,
        platformFeePercent: planConfig.platformFeePercent,
        monthlyPrice: planConfig.price,
        startedAt: newSubscription.startedAt.toISOString(),
        expiresAt: newSubscription.expiresAt?.toISOString() || null,
      },
    };
  }

  @Post('establishment/:establishmentId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelEstablishmentSubscription(
    @Param('establishmentId') establishmentId: string,
    @Body() body: { ownerId: string },
  ) {
    const subscription = await this.subscriptionRepository.findByOwnerId(body.ownerId);
    
    if (!subscription) {
      return {
        success: false,
        message: 'Nenhuma assinatura encontrada',
      };
    }

    // Cancela assinatura atual
    await this.cancelSubscriptionUseCase.execute({
      subscriptionId: subscription.id,
    });

    // Cria assinatura FREE automaticamente
    const freeSubscription = await this.createSubscriptionUseCase.execute({
      ownerId: body.ownerId,
      establishmentId: establishmentId,
      planType: PlanType.FREE,
    });

    return {
      success: true,
      message: 'Assinatura cancelada. Você voltou para o plano FREE.',
      subscription: {
        id: freeSubscription.id,
        planType: freeSubscription.planType,
        status: freeSubscription.status,
        platformFeePercent: 10,
        monthlyPrice: 0,
      },
    };
  }

  // ==================== ENDPOINTS DE PAGAMENTO ====================

  @Post('establishment/:establishmentId/plan/payment')
  @HttpCode(HttpStatus.OK)
  async createPlanPayment(
    @Param('establishmentId') establishmentId: string,
    @Body() body: { planType: PlanType; ownerId: string; payerEmail: string },
  ) {
    try {
      // Buscar owner para pegar email
      const owner = await this.prisma.owner.findUnique({
        where: { id: body.ownerId },
      });

      if (!owner) {
        return {
          success: false,
          message: 'Proprietário não encontrado',
        };
      }

      const result = await this.createSubscriptionPaymentUseCase.execute({
        establishmentId,
        ownerId: body.ownerId,
        planType: body.planType,
        payerEmail: body.payerEmail || owner.email,
      });

      return {
        success: true,
        payment: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro ao criar pagamento',
      };
    }
  }

  // Webhook do Mercado Pago
  @Post('webhook/mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(@Body() body: any, @Req() req: Request) {
    console.log('Webhook recebido:', body);

    try {
      // Mercado Pago envia notificações sobre pagamentos
      if (body.type === 'payment') {
        const paymentId = body.data?.id;
        
        if (!paymentId) {
          return { status: 'ignored' };
        }

        // Buscar informações do pagamento no Mercado Pago
        const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        
        if (!mercadoPagoToken) {
          console.warn('MERCADOPAGO_ACCESS_TOKEN não configurado');
          return { status: 'ignored' };
        }

        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${mercadoPagoToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar pagamento');
        }

        const paymentData = await response.json();
        const subscriptionId = paymentData.external_reference;
        
        if (!subscriptionId) {
          console.warn('Pagamento sem referência de assinatura');
          return { status: 'ignored' };
        }

        // Processar pagamento
        await this.processSubscriptionPaymentUseCase.execute({
          subscriptionId,
          mpPaymentId: paymentId,
          status: paymentData.status === 'approved' ? 'approved' : 
                  paymentData.status === 'rejected' ? 'rejected' : 'pending',
        });

        return { status: 'processed' };
      }

      return { status: 'ignored' };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Callback de sucesso do pagamento (redirecionamento)
  @Get('payment/success')
  async paymentSuccess(@Query() query: any, @Res() res: Response) {
    const { collection_id, external_reference } = query;
    
    if (collection_id && external_reference) {
      // Processar pagamento aprovado
      await this.processSubscriptionPaymentUseCase.execute({
        subscriptionId: external_reference,
        mpPaymentId: collection_id,
        status: 'approved',
      });
    }

    // Redirecionar para página de sucesso
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/assinatura?payment=success`);
  }

  // ==================== ENDPOINTS DE ASSINATURA RECORRENTE ====================

  @Post('recurring/:subscriptionId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRecurringSubscription(
    @Param('subscriptionId') subscriptionId: string,
  ) {
    try {
      await this.cancelRecurringSubscriptionUseCase.execute({
        subscriptionId,
      });

      return {
        success: true,
        message: 'Assinatura cancelada com sucesso',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro ao cancelar assinatura',
      };
    }
  }

  @Post('webhook/recurring')
  @HttpCode(HttpStatus.OK)
  async handleRecurringWebhook(@Body() body: any) {
    console.log('📨 Webhook recorrente recebido:', body);

    try {
      // Mercado Pago envia notificações sobre cobrança recorrente
      if (body.type === 'subscription_recurring') {
        const chargeId = body.data?.id;
        const subscriptionId = body.data?.subscription_id;
        const status = body.data?.status;

        if (!chargeId || !subscriptionId) {
          console.warn('Webhook sem ID de charge ou subscription');
          return { status: 'ignored' };
        }

        // Processar charge recorrente
        await this.processRecurringPaymentUseCase.execute({
          mpSubscriptionId: subscriptionId,
          mpChargeId: chargeId,
          status: status === 'approved' ? 'approved' :
                  status === 'rejected' ? 'rejected' :
                  status === 'pending' ? 'pending' :
                  status === 'refunded' ? 'refunded' : 'pending',
          amount: body.data?.amount || 0,
        });

        return { status: 'processed' };
      }

      return { status: 'ignored' };
    } catch (error: any) {
      console.error('Erro ao processar webhook recorrente:', error);
      return { status: 'error', message: error.message };
    }
  }
}
