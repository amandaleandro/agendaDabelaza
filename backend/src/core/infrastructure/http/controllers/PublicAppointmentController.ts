import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Post,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma/PrismaService';
import { PublicCreateAppointmentDto } from '../dtos/PublicCreateAppointmentDto';
import { AvailableSlotsDto } from '../dtos/AvailableSlotsDto';
import { AvailableDatesDto } from '../dtos/AvailableDatesDto';
import { CreateAppointmentUseCase } from '../../../application/appointments/CreateAppointmentUseCase';

@Controller('public/appointments')
export class PublicAppointmentController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: PublicCreateAppointmentDto) {
    try {
      console.log(
        '[PublicAppointmentController] Incoming DTO',
        JSON.stringify(dto),
      );

      const establishment = await this.prisma.establishment.findUnique({
        where: { slug: dto.establishmentSlug },
      });
      if (!establishment)
        throw new NotFoundException('Establishment not found');
      console.log(
        '[PublicAppointmentController] Establishment',
        establishment.id,
      );

      // Validar todos os pares serviço-profissional
      const serviceIds = dto.services.map(s => s.serviceId);
      
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          establishmentId: establishment.id,
        },
      });
      
      if (services.length !== serviceIds.length) {
        throw new NotFoundException('One or more services not found in this establishment');
      }

      // Auto-atribuir profissionais se não foram especificados
      const servicesWithProfessionals = dto.services.map(item => {
        const service = services.find(s => s.id === item.serviceId);
        if (!service) {
          throw new NotFoundException(`Service ${item.serviceId} not found`);
        }
        
        // Se professionalId não foi especificado, usar o profissional padrão do serviço
        const professionalId = item.professionalId || service.professionalId;
        
        // Validar que o profissional oferece o serviço
        if (service.professionalId !== professionalId) {
          throw new BadRequestException(
            `Service ${item.serviceId} is not offered by professional ${professionalId}`
          );
        }
        
        return {
          serviceId: item.serviceId,
          professionalId: professionalId
        };
      });

      const professionalIds = [...new Set(servicesWithProfessionals.map(s => s.professionalId))];
      
      // Validar que todos os profissionais pertencem ao estabelecimento
      const professionals = await this.prisma.professional.findMany({
        where: {
          id: { in: professionalIds },
          establishmentId: establishment.id,
        },
      });

      if (professionals.length !== professionalIds.length) {
        throw new NotFoundException('One or more professionals not found in this establishment');
      }
      
      console.log('[PublicAppointmentController] Services', services.map(s => s.id));
      console.log('[PublicAppointmentController] Professionals', professionals.map(p => p.id));

      // Construir data/horário em tempo local para evitar ambiguidades de timezone
      const [slotHour, slotMinute] = dto.slot.split(':').map((n) => parseInt(n, 10));
      const scheduledAt = new Date(`${dto.date}T00:00:00`);
      scheduledAt.setHours(slotHour || 0, slotMinute || 0, 0, 0);
      if (isNaN(scheduledAt.getTime())) {
        throw new BadRequestException('Invalid date/slot');
      }
      console.log(
        '[PublicAppointmentController] ScheduledAt',
        scheduledAt.toISOString(),
      );

      // Verificar se usuário já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email }
      });

      let user;
      if (existingUser) {
        // Usuário já existe - apenas atualizar dados básicos
        const updateData: any = {
          name: dto.name,
          phone: dto.phone,
        };
        
        // Só atualizar senha se foi fornecida
        if (dto.password) {
          updateData.password = await bcrypt.hash(dto.password, 10);
        }
        
        user = await this.prisma.user.update({
          where: { email: dto.email },
          data: updateData,
        });
        console.log('[PublicAppointmentController] User updated (existing)', user.id);
      } else {
        // Novo usuário - senha é obrigatória
        if (!dto.password) {
          throw new BadRequestException('Password is required for new users');
        }
        
        user = await this.prisma.user.create({
          data: {
            id: randomUUID(),
            name: dto.name,
            email: dto.email,
            password: await bcrypt.hash(dto.password, 10),
            phone: dto.phone,
          }
        });
        console.log('[PublicAppointmentController] User created (new)', user.id);
      }

      // Verificar se o usuário tem assinatura ativa no estabelecimento
      const subscription = await this.prisma.clientSubscription.findFirst({
        where: {
          userId: user.id,
          establishmentId: establishment.id,
          status: 'ACTIVE',
          expiresAt: {
            gte: new Date(),
          },
          usedCredits: {
            lt: this.prisma.clientSubscription.fields.totalCredits,
          },
        },
      });

      let hasActiveSubscription = false;
      if (subscription && subscription.usedCredits < subscription.totalCredits) {
        hasActiveSubscription = true;
        console.log('[PublicAppointmentController] Active subscription found', subscription.id);
      }

      await this.prisma.userEstablishment.upsert({
        where: {
          userId_establishmentId: {
            userId: user.id,
            establishmentId: establishment.id,
          },
        },
        update: {
          lastAppointmentAt: new Date(),
        },
        create: {
          userId: user.id,
          establishmentId: establishment.id,
          firstAppointmentAt: new Date(),
          lastAppointmentAt: new Date(),
        },
      });
      console.log('[PublicAppointmentController] Linked user to establishment');

      // Criar um agendamento para cada serviço selecionado, encadeando horários
      // para evitar overlap entre os próprios serviços selecionados.
      const appointments: any[] = [];
      let totalPrice = 0;
      let currentStart = new Date(scheduledAt);

      for (const item of servicesWithProfessionals) {
        const service = services.find(s => s.id === item.serviceId)!;
        const professional = professionals.find(p => p.id === item.professionalId)!;
        const appointmentStart = new Date(currentStart);
        
        const appointment = await this.createAppointmentUseCase.execute({
          id: randomUUID(),
          userId: user.id,
          establishmentId: establishment.id,
          professionalId: item.professionalId,
          serviceId: item.serviceId,
          scheduledAt: appointmentStart,
          clientName: user.name,
          clientEmail: user.email,
          clientPhone: user.phone || undefined,
          professionalName: professional.name,
          establishmentName: establishment.name,
        });
        appointments.push(appointment);
        totalPrice += service.price;
        currentStart = new Date(
          appointmentStart.getTime() + service.durationMinutes * 60 * 1000,
        );
        console.log('[PublicAppointmentController] Appointment created:', appointment.id);
      }

      // Se tem assinatura ativa, descontar um crédito por agendamento
      if (hasActiveSubscription && subscription) {
        await this.prisma.clientSubscription.update({
          where: { id: subscription.id },
          data: {
            usedCredits: {
              increment: appointments.length,
            },
          },
        });
        console.log('[PublicAppointmentController] Subscription credits used:', appointments.length);
      }

      if (!appointments.length) {
        throw new BadRequestException('Failed to create appointments');
      }

      const firstAppointment = appointments[0] as any;

      return {
        id: firstAppointment.id,
        appointments: appointments.map(a => ({
          id: a.id,
          serviceId: a.serviceId,
          professionalId: a.professionalId,
          scheduledAt: a.scheduledAt.toISOString(),
          status: a.status,
        })),
        userId: firstAppointment.userId,
        establishmentId: firstAppointment.establishmentId,
        scheduledAt: firstAppointment.scheduledAt.toISOString(),
        status: firstAppointment.status,
        totalPrice,
        usedSubscription: hasActiveSubscription,
        subscriptionCreditsRemaining: hasActiveSubscription && subscription 
          ? subscription.totalCredits - subscription.usedCredits - appointments.length
          : undefined,
      };
    } catch (error) {
      console.error('[PublicAppointmentController] Error', error);
      
      // Se for uma HttpException (NotFoundException, BadRequestException), relançar
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Se for um erro genérico, verificar a mensagem
      if (error instanceof Error) {
        console.error('[PublicAppointmentController] Stack', error.stack);
        
        // Erros de validação de agendamento
        if (error.message.includes('not available')) {
          throw new BadRequestException(error.message);
        }
        if (error.message.includes('conflict') || error.message.includes('overlap')) {
          throw new BadRequestException(error.message);
        }
        if (error.message.includes('Invalid') || error.message.includes('invalid')) {
          throw new BadRequestException(error.message);
        }
      }
      
      // Relançar erro padrão como BadRequest
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao criar agendamento'
      );
    }
  }

  @Post('available-slots')
  @HttpCode(HttpStatus.OK)
  async getAvailableSlots(@Body() dto: AvailableSlotsDto): Promise<string[]> {
    try {
      const establishment = await this.prisma.establishment.findUnique({
        where: { slug: dto.establishmentSlug },
      });
      if (!establishment) {
        throw new NotFoundException('Establishment not found');
      }

      // Validar data (usar horário local para evitar mudança de dia)
      const date = new Date(dto.date + 'T00:00:00');
      const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];

      // Obter todos os profissionais únicos
      const professionalIds = [...new Set(dto.services.map(s => s.professionalId))];

      // Buscar schedules de todos os profissionais para este dia
      const schedules = await this.prisma.schedule.findMany({
        where: {
          professionalId: { in: professionalIds },
          dayOfWeek: dayOfWeek as any,
          isAvailable: true,
        },
      });

      if (schedules.length === 0) {
        return [];
      }

      // Encontrar o horário mais restritivo (interseção de todos os schedules)
      const startTimes = schedules.map(s => s.startTime);
      const endTimes = schedules.map(s => s.endTime);
      const latestStart = startTimes.reduce((a, b) => a > b ? a : b);
      const earliestEnd = endTimes.reduce((a, b) => a < b ? a : b);

      // Converter para minutos
      const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const startMin = toMinutes(latestStart);
      const endMin = toMinutes(earliestEnd);

      if (startMin >= endMin) {
        return []; // Nenhum horário comum
      }

      // Calcular duração total necessária
      const serviceIds = dto.services.map(s => s.serviceId);
      const services = await this.prisma.service.findMany({
        where: { id: { in: serviceIds } },
      });

      const totalDuration = dto.services.reduce((sum, pair) => {
        const service = services.find(s => s.id === pair.serviceId);
        return sum + (service?.durationMinutes || 0);
      }, 0);

      // Buscar agendamentos existentes para todos os profissionais nesta data
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const existingAppointments = await this.prisma.appointment.findMany({
        where: {
          professionalId: { in: professionalIds },
          scheduledAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          service: true,
        },
      });

      // Gerar slots a cada 15 minutos
      const slots: string[] = [];
      for (let min = startMin; min + totalDuration <= endMin; min += 15) {
        const hours = Math.floor(min / 60);
        const minutes = min % 60;
        const slotTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Verificar se o slot está disponível para TODOS os profissionais
        let isAvailable = true;
        let currentTime = min;

        for (const pair of dto.services) {
          const service = services.find(s => s.id === pair.serviceId);
          if (!service) {
            isAvailable = false;
            break;
          }

          const slotStart = new Date(date);
          // Construir horário em tempo local
          slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60 * 1000);

          // Verificar conflitos para este profissional específico
          const hasConflict = existingAppointments.some(apt => {
            if (apt.professionalId !== pair.professionalId) return false;

            const aptStart = apt.scheduledAt;
            const aptEnd = new Date(aptStart.getTime() + apt.durationMinutes * 60 * 1000);

            return slotStart < aptEnd && slotEnd > aptStart;
          });

          if (hasConflict) {
            isAvailable = false;
            break;
          }

          currentTime += service.durationMinutes;
        }

        if (isAvailable) {
          slots.push(slotTime);
        }
      }

      return slots;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao buscar horários disponíveis'
      );
    }
  }

  @Post('available-dates')
  @HttpCode(HttpStatus.OK)
  async getAvailableDates(@Body() dto: AvailableDatesDto): Promise<string[]> {
    try {
      const establishment = await this.prisma.establishment.findUnique({
        where: { slug: dto.establishmentSlug },
      });
      if (!establishment) {
        throw new NotFoundException('Establishment not found');
      }

      const daysToCheck = dto.daysAhead || 14;
      const availableDates: string[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obter todos os profissionais únicos
      const professionalIds = [...new Set(dto.services.map(s => s.professionalId))];

      // Buscar schedules de todos os profissionais
      const schedules = await this.prisma.schedule.findMany({
        where: {
          professionalId: { in: professionalIds },
          isAvailable: true,
        },
      });

      if (schedules.length === 0) {
        return [];
      }

      // Obter serviços para calcular duração
      const serviceIds = dto.services.map(s => s.serviceId);
      const services = await this.prisma.service.findMany({
        where: { id: { in: serviceIds } },
      });

      const totalDuration = dto.services.reduce((sum, pair) => {
        const service = services.find(s => s.id === pair.serviceId);
        return sum + (service?.durationMinutes || 0);
      }, 0);

      // Verificar cada dia
      for (let i = 0; i < daysToCheck; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][checkDate.getDay()];

        // Verificar se todos os profissionais trabalham neste dia
        const schedulesForDay = schedules.filter(s => s.dayOfWeek === dayOfWeek);
        const allProfessionalsWork = professionalIds.every(profId =>
          schedulesForDay.some(s => s.professionalId === profId)
        );

        if (!allProfessionalsWork) {
          continue;
        }

        // Calcular horário comum (interseção)
        const profSchedules = professionalIds.map(profId =>
          schedulesForDay.find(s => s.professionalId === profId)!
        );

        const toMinutes = (time: string) => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };

        const startTimes = profSchedules.map(s => toMinutes(s.startTime));
        const endTimes = profSchedules.map(s => toMinutes(s.endTime));
        const latestStart = Math.max(...startTimes);
        const earliestEnd = Math.min(...endTimes);

        if (latestStart + totalDuration > earliestEnd) {
          continue; // Não há tempo suficiente
        }

        // Buscar agendamentos existentes para este dia
        const dayStart = new Date(checkDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);

        const existingAppointments = await this.prisma.appointment.findMany({
          where: {
            professionalId: { in: professionalIds },
            scheduledAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
        });

        // Verificar se há pelo menos um slot disponível
        let hasAvailableSlot = false;
        for (let min = latestStart; min + totalDuration <= earliestEnd; min += 15) {
          let isAvailable = true;
          let currentTime = min;

          for (const pair of dto.services) {
            const service = services.find(s => s.id === pair.serviceId);
            if (!service) {
              isAvailable = false;
              break;
            }

            const slotStart = new Date(checkDate);
            // Construir horário em tempo local
            slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60 * 1000);

            const hasConflict = existingAppointments.some(apt => {
              if (apt.professionalId !== pair.professionalId) return false;
              const aptStart = apt.scheduledAt;
              const aptEnd = new Date(aptStart.getTime() + apt.durationMinutes * 60 * 1000);
              return slotStart < aptEnd && slotEnd > aptStart;
            });

            if (hasConflict) {
              isAvailable = false;
              break;
            }

            currentTime += service.durationMinutes;
          }

          if (isAvailable) {
            hasAvailableSlot = true;
            break;
          }
        }

        if (hasAvailableSlot) {
          availableDates.push(checkDate.toISOString().split('T')[0]);
        }
      }

      return availableDates;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao buscar datas disponíveis'
      );
    }
  }
}
