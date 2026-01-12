import { AppointmentItem } from '../entities/AppointmentItem';

export interface AppointmentItemRepository {
  save(item: AppointmentItem): Promise<void>;
  findById(id: string): Promise<AppointmentItem | null>;
  findByAppointment(appointmentId: string): Promise<AppointmentItem[]>;
  delete(id: string): Promise<void>;
}
