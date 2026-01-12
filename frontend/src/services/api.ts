import axios, { AxiosInstance } from 'axios';
import {
  Client,
  Professional,
  Service,
  Appointment,
  Payment,
  Subscription,
  Schedule,
  Product,
  CreateClientRequest,
  CreateProfessionalRequest,
  CreateServiceRequest,
  CreateAppointmentRequest,
  CreatePaymentRequest,
  CreateSubscriptionRequest,
  SetScheduleRequest,
  CreateProductRequest,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token JWT
    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ========== AUTH ==========

  async signup(data: any): Promise<any> {
    const response = await this.client.post('/auth/signup', data);
    return response.data;
  }

  async login(data: any): Promise<any> {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  // ========== ESTABLISHMENTS ==========

  async listEstablishments(): Promise<any[]> {
    const response = await this.client.get('/establishments');
    return response.data;
  }

  // ========== CLIENTS ==========

  async createClient(data: CreateClientRequest): Promise<Client> {
    const response = await this.client.post('/clients', data);
    return response.data;
  }

  async listClients(): Promise<Client[]> {
    const response = await this.client.get('/clients');
    return response.data;
  }

  async getClient(id: string): Promise<Client> {
    const response = await this.client.get(`/clients/${id}`);
    return response.data;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const response = await this.client.put(`/clients/${id}`, data);
    return response.data;
  }

  async deleteClient(id: string): Promise<void> {
    await this.client.delete(`/clients/${id}`);
  }

  async setClientBlocked(id: string, blocked: boolean): Promise<Client> {
    const response = await this.client.patch(`/clients/${id}/block`, { blocked });
    return response.data;
  }

  // ========== PROFESSIONALS ==========

  async createProfessional(data: CreateProfessionalRequest): Promise<Professional> {
    const response = await this.client.post('/professionals', data);
    return response.data;
  }

  async getProfessional(id: string): Promise<Professional> {
    const response = await this.client.get(`/professionals/${id}`);
    return response.data;
  }

  async updateProfessional(id: string, data: Partial<Professional>): Promise<Professional> {
    const response = await this.client.put(`/professionals/${id}`, data);
    return response.data;
  }

  async deleteProfessional(id: string): Promise<void> {
    await this.client.delete(`/professionals/${id}`);
  }

  async listProfessionals(): Promise<Professional[]> {
    const response = await this.client.get('/professionals');
    return response.data;
  }

  // ========== SERVICES ==========

  async createService(data: CreateServiceRequest): Promise<Service> {
    const response = await this.client.post(`/professionals/${data.professionalId}/services`, data);
    return response.data;
  }

  async listServices(): Promise<Service[]> {
    const response = await this.client.get('/services');
    return response.data;
  }

  async listProfessionalServices(professionalId: string): Promise<Service[]> {
    const response = await this.client.get(`/professionals/${professionalId}/services`);
    return response.data;
  }

  async getService(id: string): Promise<Service> {
    const response = await this.client.get(`/services/${id}`);
    return response.data;
  }

  // ========== APPOINTMENTS ==========

  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    const response = await this.client.post('/appointments', data);
    return response.data;
  }

  async getAppointment(id: string): Promise<Appointment> {
    const response = await this.client.get(`/appointments/${id}`);
    return response.data;
  }

  async listAppointments(): Promise<Appointment[]> {
    const response = await this.client.get('/appointments');
    return response.data;
  }

  async listAppointmentsByClient(clientId: string): Promise<Appointment[]> {
    const response = await this.client.get(`/appointments/client/${clientId}`);
    return response.data;
  }

  async cancelAppointment(id: string): Promise<void> {
    await this.client.delete(`/appointments/${id}`);
  }

  // ========== SCHEDULES ==========

  async setSchedules(data: SetScheduleRequest): Promise<Schedule[]> {
    const response = await this.client.post('/schedules', data);
    return response.data;
  }

  async getProfessionalSchedules(professionalId: string): Promise<Schedule[]> {
    const response = await this.client.get(`/professionals/${professionalId}/schedules`);
    return response.data;
  }

  // ========== PRODUCTS ==========

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await this.client.post('/products', data);
    return response.data;
  }

  async listProducts(professionalId?: string): Promise<Product[]> {
    const response = await this.client.get('/products', {
      params: professionalId ? { professionalId } : undefined,
    });
    return response.data;
  }

  async listProfessionalProducts(professionalId: string): Promise<Product[]> {
    const response = await this.client.get(`/professionals/${professionalId}/products`);
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.client.get(`/products/${id}`);
    return response.data;
  }

  // ========== PAYMENTS ==========

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await this.client.post('/payments', data);
    return response.data;
  }

  async listPayments(): Promise<Payment[]> {
    const response = await this.client.get('/payments');
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await this.client.get(`/payments/${id}`);
    return response.data;
  }

  // ========== SUBSCRIPTIONS ==========

  async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription> {
    const response = await this.client.post('/subscriptions', data);
    return response.data;
  }

  async listSubscriptions(): Promise<Subscription[]> {
    const response = await this.client.get('/subscriptions');
    return response.data;
  }

  async getSubscription(id: string): Promise<Subscription> {
    const response = await this.client.get(`/subscriptions/${id}`);
    return response.data;
  }

  async cancelSubscription(id: string): Promise<void> {
    await this.client.delete(`/subscriptions/${id}`);
  }

  // Novos métodos de subscription management
  async getPlans(): Promise<any> {
    const response = await this.client.get('/subscriptions/plans');
    return response.data;
  }

  async getEstablishmentPlan(establishmentId: string): Promise<any> {
    const response = await this.client.get(`/subscriptions/establishment/${establishmentId}`);
    return response.data;
  }

  async changeEstablishmentPlan(establishmentId: string, planType: string, ownerId: string): Promise<any> {
    const response = await this.client.post(
      `/subscriptions/establishment/${establishmentId}/plan`,
      { planType, ownerId }
    );
    return response.data;
  }

  async cancelEstablishmentSubscription(establishmentId: string, ownerId: string): Promise<any> {
    const response = await this.client.post(
      `/subscriptions/establishment/${establishmentId}/cancel`,
      { ownerId }
    );
    return response.data;
  }

  // ========== CLIENT SUBSCRIPTIONS ==========

  async getMySubscriptions(): Promise<any[]> {
    const response = await this.client.get('/client-subscriptions/my-subscriptions');
    return response.data;
  }

  async getEstablishmentSubscriptions(establishmentId: string): Promise<any[]> {
    const response = await this.client.get(`/client-subscriptions/establishment/${establishmentId}`);
    return response.data;
  }

  async purchaseServicePlan(servicePlanId: string, data: any): Promise<any> {
    const response = await this.client.post(`/public/client-subscriptions/purchase/${servicePlanId}`, data);
    return response.data;
  }

  async changePlan(subscriptionId: string, servicePlanId: string): Promise<any> {
    const response = await this.client.put(`/client-subscriptions/${subscriptionId}/change-plan`, {
      servicePlanId,
    });
    return response.data;
  }

  async cancelClientSubscription(subscriptionId: string): Promise<any> {
    const response = await this.client.delete(`/client-subscriptions/${subscriptionId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
