import { Payment } from '../entities/Payment';

export interface PaymentRepository {
  save(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  findByAppointment(appointmentId: string): Promise<Payment[]>;
  findAll(): Promise<Payment[]>;
}
