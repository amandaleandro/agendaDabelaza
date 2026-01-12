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

export interface NotificationGateway {
  sendAppointmentConfirmationEmail(
    data: AppointmentNotificationData,
  ): Promise<void>;
  sendAppointmentConfirmationWhatsApp(
    data: AppointmentNotificationData,
  ): Promise<void>;
}
