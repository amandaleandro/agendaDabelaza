import {
  AppointmentNotificationData,
  NotificationGateway,
} from '../../domain/gateways/NotificationGateway';

export class ConsoleNotificationGateway implements NotificationGateway {
  async sendAppointmentConfirmationEmail(
    data: AppointmentNotificationData,
  ): Promise<void> {
    console.log('\n[EMAIL] Appointment confirmation');
    console.log(`To: ${data.clientEmail}`);
    console.log(`Subject: Agendamento confirmado - ${data.establishmentName}`);
  }

  async sendAppointmentConfirmationWhatsApp(
    data: AppointmentNotificationData,
  ): Promise<void> {
    if (!data.clientPhone) {
      console.log('[WHATSAPP] Phone not informed, confirmation skipped');
      return;
    }

    console.log('\n[WHATSAPP] Appointment confirmation');
    console.log(`To: ${data.clientPhone}`);
    console.log(`Appointment: ${data.appointmentId}`);
  }

  async scheduleAppointmentReminders(
    _data: AppointmentNotificationData,
  ): Promise<void> {
    console.log('[WHATSAPP] Reminder scheduling would run in production');
  }
}
