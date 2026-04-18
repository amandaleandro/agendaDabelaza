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

  @Post('process-reminders')
  @HttpCode(HttpStatus.OK)
  async processReminders() {
    return this.whatsAppBaileysService.processDueReminders();
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
