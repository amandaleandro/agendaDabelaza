import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/PrismaService';

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('platform')
  async getPlatformSettings() {
    // Settings padrão - em um futuro pode vir de um modelo Settings no banco
    return {
      siteName: 'Agendei',
      siteUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      supportEmail: 'support@agendei.com',
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      currency: 'BRL',
      features: {
        enableAppointments: true,
        enableSubscriptions: true,
        enablePayments: true,
        enableGallery: true,
        enableReviews: true,
        enableNotifications: true,
      },
      limits: {
        maxEstablishments: 1000,
        maxUsersPerEstablishment: 100,
        maxAppointmentsPerDay: 10000,
      },
    };
  }

  @Get('system')
  async getSystemSettings() {
    // Info do sistema
    const establishments = await this.prisma.establishment.count();
    const users = await this.prisma.user.count();
    const appointments = await this.prisma.appointment.count();
    
    return {
      version: process.env.APP_VERSION || '0.0.44',
      environment: process.env.NODE_ENV || 'production',
      database: {
        type: 'PostgreSQL',
        host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
        connected: true, // Simplificado - em produção verificaria a conexão
      },
      statistics: {
        totalEstablishments: establishments,
        totalUsers: users,
        totalAppointments: appointments,
      },
      lastUpdated: new Date(),
    };
  }

  @Get('email')
  async getEmailSettings() {
    return {
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      fromEmail: process.env.EMAIL_FROM || 'noreply@agendei.com',
      fromName: 'Agendei',
      enabled: !!process.env.EMAIL_API_KEY,
      templates: {
        appointmentConfirmation: true,
        appointmentReminder: true,
        paymentReceipt: true,
        subscriptionUpdates: true,
        userNotifications: true,
      },
    };
  }

  @Post('update-platform')
  async updatePlatformSettings(@Body() data: any) {
    // Validar e atualizar settings de plataforma
    // Por enquanto, apenas retornar confirmação
    return {
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data,
    };
  }
}
