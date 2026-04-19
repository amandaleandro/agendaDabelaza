import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WhatsAppBaileysService } from '../../whatsapp/WhatsAppBaileysService';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsAppBaileysService: WhatsAppBaileysService,
  ) {}

  @Get('status')
  getStatus() {
    return this.whatsAppBaileysService.getStatus();
  }

  @Post('connect')
  @HttpCode(HttpStatus.ACCEPTED)
  async connect() {
    await this.whatsAppBaileysService.connect();
    return {
      status: 'CONNECTING',
      ...this.whatsAppBaileysService.getStatus(),
    };
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect() {
    await this.whatsAppBaileysService.disconnect();
    return {
      status: 'DISCONNECTED',
      ...this.whatsAppBaileysService.getStatus(),
    };
  }

  @Post('process-reminders')
  @HttpCode(HttpStatus.OK)
  async processReminders() {
    return this.whatsAppBaileysService.processDueReminders();
  }

  @Post('sync-reminders')
  @HttpCode(HttpStatus.OK)
  async syncReminders(
    @Body() body: { scope?: 'DAY' | 'WEEK' | 'MONTH' | 'ALL' },
  ) {
    return this.whatsAppBaileysService.syncUpcomingReminders(
      body?.scope || 'MONTH',
    );
  }

  @Get('history')
  async history() {
    return this.whatsAppBaileysService.listReminderHistory();
  }

  @Post('test-message')
  @HttpCode(HttpStatus.OK)
  async sendTestMessage(
    @Body() body: { phone: string; message?: string },
  ) {
    await this.whatsAppBaileysService.sendDirectMessage(
      body.phone,
      body.message || 'Mensagem de teste enviada pela central de WhatsApp.',
    );

    return { success: true };
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  async simulate(
    @Body() body: { senderPhone: string; text: string },
  ) {
    return this.whatsAppBaileysService.simulateIncomingMessage(
      body.senderPhone,
      body.text,
    );
  }
}
