import { Payment } from '../../../domain/entities/Payment';
import { PaymentRepository } from '../../../domain/repositories/PaymentRepository';

// In-memory implementation for tests and local dev.
export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly items = new Map<string, Payment[]>();
  private readonly byId = new Map<string, Payment>();

  async save(payment: Payment): Promise<void> {
    const list = this.items.get(payment.appointmentId) ?? [];
    list.push(payment);
    this.items.set(payment.appointmentId, list);
    this.byId.set(payment.id, payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.byId.get(id) ?? null;
  }

  async findByAppointment(appointmentId: string): Promise<Payment[]> {
    return this.items.get(appointmentId) ?? [];
  }

  async findAll(): Promise<Payment[]> {
    return Array.from(this.byId.values());
  }
}
