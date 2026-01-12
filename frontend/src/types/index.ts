// Entidades do domínio

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  blocked?: boolean;
  createdAt: string;
}

export interface Professional {
  id: string;
  establishmentId?: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Service {
  id: string;
  professionalId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  createdAt: string;
}

export interface Schedule {
  id: string;
  professionalId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  createdAt: string;
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export interface Product {
  id: string;
  professionalId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  createdAt: string;
}

export interface Appointment {
  userId: any;
  id: string;
  clientId?: string; // backwards compatibility
  professionalId?: string; // backwards compatibility
  serviceId?: string; // backwards compatibility
  scheduledAt?: string; // backwards compatibility
  date?: string; // new format
  slot?: string; // new format
  durationMinutes?: number;
  status: AppointmentStatus;
  price: number;
  depositPayment?: Payment | null;
  items?: AppointmentItem[];
  createdAt: string;
  // Nested objects from API
  client?: {
    name: string;
    email: string;
    phone: string;
  };
  professional?: {
    name: string;
  };
  service?: {
    name: string;
    durationMinutes: number;
  };
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface AppointmentItem {
  id: string;
  appointmentId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  type: PaymentType;
  platformFee: number;
  professionalAmount: number;
  transactionId?: string;
  transferId?: string;
  status: PaymentStatus;
  createdAt: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentType {
  FULL = 'FULL',
  DEPOSIT = 'DEPOSIT',
  CANCELLATION_FEE = 'CANCELLATION_FEE',
}

export interface Subscription {
  price: number;
  id: string;
  ownerId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt?: string;
}

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// Request/Response DTOs

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
}

export interface CreateProfessionalRequest {
  establishmentId: string;
  name: string;
  email: string;
  phone: string;
}

export interface CreateServiceRequest {
  professionalId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
}

export interface CreateAppointmentRequest {
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: string;
  depositPercent?: number;
}

export interface CreatePaymentRequest {
  appointmentId: string;
  amount: number;
}

export interface CreateSubscriptionRequest {
  ownerId: string;
  planType: PlanType;
}

export interface SetScheduleRequest {
  establishmentId: string;
  professionalId: string;
  schedules: ScheduleIntervalInput[];
}

export interface ScheduleIntervalInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface CreateProductRequest {
  establishmentId?: string;
  professionalId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}
