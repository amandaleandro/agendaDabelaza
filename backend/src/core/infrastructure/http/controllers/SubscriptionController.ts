import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateSubscriptionUseCase } from '../../../application/subscriptions/CreateSubscriptionUseCase';
import { CancelSubscriptionUseCase } from '../../../application/subscriptions/CancelSubscriptionUseCase';
import { GetEstablishmentPlanUseCase } from '../../../application/subscriptions/GetEstablishmentPlanUseCase';
import { CreateSubscriptionDto } from '../dtos/CreateSubscriptionDto';
import { PrismaSubscriptionRepository } from '../../database/repositories/PrismaSubscriptionRepository';
import { PlanType } from '../../../domain/entities/Plan';

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
    private readonly subscriptionRepository: PrismaSubscriptionRepository,
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
    
    return {
      planType: plan.planType,
      platformFeePercent: plan.platformFeePercent,
      monthlyPrice: plan.monthlyPrice,
      hasCommission: plan.hasCommission,
      features: PLAN_CONFIG[plan.planType]?.features || [],
    };
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
}
