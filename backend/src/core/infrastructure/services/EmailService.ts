import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendEmailInput {
  to: string;
  subject: string;
  template: 'payment_receipt' | 'renewal_confirmation' | 'trial_ending';
  variables?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Se estiver em modo simulação (sem env vars), não criar transporter
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      console.warn('⚠️ Email não configurado - usando modo simulação');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    const html = this.getTemplate(input.template, input.variables || {});

    if (!this.transporter) {
      console.log('📧 [SIMULAÇÃO] Email não enviado:', {
        to: input.to,
        subject: input.subject,
        template: input.template,
      });
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || 'noreply@agendei.com',
        to: input.to,
        subject: input.subject,
        html,
      });

      console.log('✅ Email enviado com sucesso para:', input.to);
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error.message);
      throw error;
    }
  }

  private getTemplate(
    template: string,
    variables: Record<string, any>,
  ): string {
    switch (template) {
      case 'payment_receipt':
        return this.paymentReceiptTemplate(variables);
      case 'renewal_confirmation':
        return this.renewalConfirmationTemplate(variables);
      case 'trial_ending':
        return this.trialEndingTemplate(variables);
      default:
        return '<p>Email de notificação</p>';
    }
  }

  private paymentReceiptTemplate(vars: Record<string, any>): string {
    return `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #333; margin-top: 0;">Recibo de Pagamento</h1>
            <p style="color: #666; font-size: 14px;">Olá <strong>${vars.ownerName || 'Proprietário'}</strong>,</p>
            
            <p style="color: #666; margin-top: 20px;">Seu pagamento foi recebido com sucesso! Aqui estão os detalhes:</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Plano:</strong> ${vars.planType || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${(vars.amount || 0).toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
              <p style="margin: 5px 0;"><strong>Próxima cobrança:</strong> ${vars.nextBillingDate || 'Em 30 dias'}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">Sua assinatura está ativa e será renovada automaticamente.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              Este é um email automático. Não responda diretamente. Entre em contato através do painel de controle em ${vars.dashboardUrl || 'https://agendei.com'}.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private renewalConfirmationTemplate(vars: Record<string, any>): string {
    return `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #10b981; margin-top: 0;">✓ Renovação Confirmada</h1>
            <p style="color: #666;">Olá <strong>${vars.ownerName || 'Proprietário'}</strong>,</p>
            
            <p style="color: #666; margin-top: 20px;">Sua assinatura foi renovada automaticamente!</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Plano:</strong> ${vars.planType || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Valor cobrado:</strong> R$ ${(vars.amount || 0).toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Válido até:</strong> ${vars.expiresAt || 'N/A'}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">Você pode gerenciar sua assinatura a qualquer momento no painel de controle.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              Este é um email automático. Não responda diretamente.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private trialEndingTemplate(vars: Record<string, any>): string {
    return `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #f97316; margin-top: 0;">⏰ Seu Trial Expira em Breve</h1>
            <p style="color: #666;">Olá <strong>${vars.ownerName || 'Proprietário'}</strong>,</p>
            
            <p style="color: #666; margin-top: 20px;">Seu período de trial de 14 dias está terminando!</p>
            
            <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Plano:</strong> ${vars.planType || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Trial expira em:</strong> ${vars.trialEndsAt || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Próximo valor:</strong> R$ ${(vars.amount || 0).toFixed(2)}/mês</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Para continuar usando o plano, confirme seu método de pagamento antes do vencimento do trial.
            </p>
            
            <a href="${vars.dashboardUrl || 'https://agendei.com'}/admin/assinatura" 
               style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; font-weight: bold;">
              Confirmar Pagamento
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              Este é um email automático. Não responda diretamente.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
