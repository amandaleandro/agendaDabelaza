export interface AppointmentNotificationData {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  establishmentName: string;
  serviceName: string;
  professionalName: string;
  scheduledAt: Date;
  price: number;
  durationMinutes: number;
}

export type AppointmentReminderType = 'REMINDER_24H' | 'REMINDER_2H';

export interface NotificationGateway {
  sendAppointmentConfirmationEmail(
    data: AppointmentNotificationData,
  ): Promise<void>;
  sendAppointmentConfirmationWhatsApp(
    data: AppointmentNotificationData,
  ): Promise<void>;
  scheduleAppointmentReminders?(
    data: AppointmentNotificationData,
  ): Promise<void>;
}
