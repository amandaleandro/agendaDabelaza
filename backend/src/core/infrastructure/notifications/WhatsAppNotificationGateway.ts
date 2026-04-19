import { Injectable } from '@nestjs/common';
import {
  AppointmentNotificationData,
  NotificationGateway,
} from '../../domain/gateways/NotificationGateway';
import { WhatsAppBaileysService } from '../whatsapp/WhatsAppBaileysService';

@Injectable()
export class WhatsAppNotificationGateway implements NotificationGateway {
  constructor(
    private readonly whatsAppBaileysService: WhatsAppBaileysService,
  ) {}

  async sendAppointmentConfirmationEmail(
    data: AppointmentNotificationData,
  ): Promise<void> {
    console.log(
      `[EMAIL] Confirmation for ${data.clientEmail} / appointment ${data.appointmentId}`,
    );
  }

  async sendAppointmentConfirmationWhatsApp(
    data: AppointmentNotificationData,
  ): Promise<void> {
    await this.whatsAppBaileysService.sendAppointmentConfirmation(data);
  }

  async scheduleAppointmentReminders(
    data: AppointmentNotificationData,
  ): Promise<void | number> {
    return this.whatsAppBaileysService.scheduleAppointmentReminders(data);
  }
}
