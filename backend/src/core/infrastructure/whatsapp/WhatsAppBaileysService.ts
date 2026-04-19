import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../database/prisma/PrismaService';
import { CreateAppointmentPaymentLinkUseCase } from '../../application/appointments/CreateAppointmentPaymentLinkUseCase';
import { CancelAppointmentUseCase } from '../../application/appointments/CancelAppointmentUseCase';
import {
  AppointmentNotificationData,
  AppointmentReminderType,
} from '../../domain/gateways/NotificationGateway';
import {
  WhatsAppAiIntent,
  WhatsAppAiService,
} from './WhatsAppAiService';
import {
  addDaysToDateKey,
  getDayOfWeekFromDateKey,
  getSaoPauloDayBounds,
  getSaoPauloDayBoundsFromDateKey,
  getSaoPauloDateKey,
  getSaoPauloDayOfWeek,
  getSaoPauloMinutes,
  getSaoPauloTodayDateKey,
  parseSaoPauloDateTime,
  getSaoPauloTimeZoneParts,
} from '../../shared/datetime/saoPaulo';

type ConversationSession = {
  establishmentSlug?: string;
  serviceId?: string;
  serviceName?: string;
  professionalId?: string;
  professionalName?: string;
  date?: string;
  time?: string;
  customerName?: string;
  customerEmail?: string;
  lastSuggestedSlots?: string[];
  suggestedTime?: string;
  pendingAction?: 'book' | 'reschedule';
  appointmentCode?: string;
  timePeriod?: 'morning' | 'afternoon' | 'evening';
};

type ReminderSyncScope = 'DAY' | 'WEEK' | 'MONTH' | 'ALL';

@Injectable()
export class WhatsAppBaileysService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WhatsAppBaileysService.name);
  private readonly authPath = path.resolve(
    process.cwd(),
    process.env.WHATSAPP_BAILEYS_AUTH_PATH || '.baileys_auth',
  );
  private readonly reminderIntervalMs = Number(
    process.env.WHATSAPP_REMINDER_INTERVAL_MS || 60000,
  );
  private readonly confirmationLeadHours = Number(
    process.env.WHATSAPP_CONFIRMATION_LEAD_HOURS || 24,
  );
  private readonly confirmationDeadlineHours = Number(
    process.env.WHATSAPP_CONFIRMATION_DEADLINE_HOURS || 12,
  );
  private readonly paymentHoldMinutes = Number(
    process.env.WHATSAPP_PAYMENT_HOLD_MINUTES || 15,
  );
  private socket: any | null = null;
  private lastQr: string | null = null;
  private connectedJid: string | null = null;
  private initializing: Promise<void> | null = null;
  private reminderTimer: NodeJS.Timeout | null = null;
  private reminderWorkerRunning = false;
  private readonly conversationSessions = new Map<string, ConversationSession>();
  private readonly simulatedOutbox = new Map<string, string[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly createAppointmentPaymentLinkUseCase: CreateAppointmentPaymentLinkUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly whatsAppAiService: WhatsAppAiService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.startReminderWorker();

    if (this.isEnabled()) {
      await this.initializeConnection().catch((error) => {
        this.logger.error(
          `Failed to initialize Baileys connection: ${this.stringifyError(error)}`,
        );
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }

    if (this.socket?.end) {
      try {
        this.socket.end(undefined);
      } catch (error) {
        this.logger.warn(
          `Error closing WhatsApp socket: ${this.stringifyError(error)}`,
        );
      }
    }
  }

  getStatus() {
    return {
      enabled: this.isEnabled(),
      connected: Boolean(this.socket?.user),
      connectedJid: this.connectedJid,
      authPath: this.authPath,
      hasQr: Boolean(this.lastQr),
      lastQr: this.lastQr,
      reminderWorkerRunning: Boolean(this.reminderTimer),
    };
  }

  async simulateIncomingMessage(senderPhone: string, text: string) {
    this.simulatedOutbox.set(senderPhone, []);
    await this.processCommand(this.normalizePhone(senderPhone), text);
    const messages = this.simulatedOutbox.get(this.normalizePhone(senderPhone)) || [];
    return {
      senderPhone: this.normalizePhone(senderPhone),
      input: text,
      replies: messages,
      session: this.conversationSessions.get(this.normalizePhone(senderPhone)) || {},
    };
  }

  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error(
        'Set WHATSAPP_BAILEYS_ENABLED=true before connecting Baileys',
      );
    }

    await this.initializeConnection(true);
  }

  async disconnect(): Promise<void> {
    if (this.socket?.end) {
      try {
        this.socket.end(undefined);
      } catch (error) {
        this.logger.warn(
          `Error closing WhatsApp socket: ${this.stringifyError(error)}`,
        );
      }
    }

    this.socket = null;
    this.connectedJid = null;
    this.lastQr = null;

    if (fs.existsSync(this.authPath)) {
      fs.rmSync(this.authPath, { recursive: true, force: true });
    }
  }

  async sendAppointmentConfirmation(
    data: AppointmentNotificationData,
  ): Promise<void> {
    const message = [
      `Ola ${data.clientName}!`,
      '',
      `Seu agendamento foi confirmado para ${data.establishmentName}.`,
      `Servico: ${data.serviceName}`,
      `Profissional: ${data.professionalName}`,
      `Quando: ${this.formatDateTime(data.scheduledAt)}`,
      `Valor: ${this.formatCurrency(data.price)}`,
      `Codigo: ${data.appointmentId}`,
      '',
      'Se precisar, responda com "meus agendamentos", "remarcar CODIGO | AAAA-MM-DD | HH:mm" ou "cancelar CODIGO".',
    ].join('\n');

    await this.sendTextMessage(data.clientPhone, message);
  }

  async sendDirectMessage(phone: string, message: string): Promise<void> {
    await this.sendTextMessage(phone, message);
  }

  async scheduleAppointmentReminders(
    data: AppointmentNotificationData,
  ): Promise<number> {
    if (!data.clientPhone) {
      return 0;
    }

    const recipientPhone = this.normalizePhone(data.clientPhone);

    const reminders = this.buildReminderSchedule(data.scheduledAt);
    if (!reminders.length) {
      return 0;
    }

    const existing = await this.prisma.whatsAppReminder.findMany({
      where: {
        appointmentId: data.appointmentId,
        status: { not: 'CANCELLED' },
      },
      select: {
        type: true,
        sendAt: true,
      },
    });

    const remindersToCreate = reminders.filter((reminder) => {
      return !existing.some(
        (item) =>
          item.type === reminder.type &&
          item.sendAt.getTime() === reminder.sendAt.getTime(),
      );
    });

    if (!remindersToCreate.length) {
      return 0;
    }

    await this.prisma.whatsAppReminder.createMany({
      data: remindersToCreate.map((reminder) => ({
        appointmentId: data.appointmentId,
        type: reminder.type,
        recipientPhone,
        sendAt: reminder.sendAt,
      })),
      skipDuplicates: false,
    });

    return remindersToCreate.length;
  }

  async processDueReminders(): Promise<{ processed: number }> {
    if (this.reminderWorkerRunning) {
      return { processed: 0 };
    }

    this.reminderWorkerRunning = true;
    let processed = 0;

    try {
      const dueReminders = await this.prisma.whatsAppReminder.findMany({
        where: {
          status: 'PENDING',
          sendAt: { lte: new Date() },
        },
        include: {
          appointment: {
            include: {
              establishment: true,
              professional: true,
              service: true,
              user: true,
            },
          },
        },
        orderBy: { sendAt: 'asc' },
        take: 20,
      });

      for (const reminder of dueReminders) {
        const locked = await this.prisma.whatsAppReminder.updateMany({
          where: {
            id: reminder.id,
            status: 'PENDING',
          },
          data: {
            status: 'PROCESSING',
            attempts: { increment: 1 },
          },
        });

        if (!locked.count) {
          continue;
        }

        try {
          const appointment = reminder.appointment;
          const text = this.buildReminderMessage(reminder.type, {
            appointmentId: appointment.id,
            clientName: appointment.user.name,
            clientEmail: appointment.user.email,
            clientPhone: appointment.user.phone,
            establishmentName: appointment.establishment.name,
            serviceName: appointment.service.name,
            professionalName: appointment.professional.name,
            scheduledAt: appointment.scheduledAt,
            price: appointment.price,
            durationMinutes: appointment.durationMinutes,
          });

          await this.sendTextMessage(reminder.recipientPhone, text);

          await this.prisma.whatsAppReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              errorMessage: null,
            },
          });
          processed += 1;
        } catch (error) {
          const nextStatus = reminder.attempts + 1 >= 3 ? 'FAILED' : 'PENDING';
          await this.prisma.whatsAppReminder.update({
            where: { id: reminder.id },
            data: {
              status: nextStatus,
              errorMessage: this.stringifyError(error),
            },
          });
        }
      }
    } finally {
      this.reminderWorkerRunning = false;
    }

    return { processed };
  }

  async syncUpcomingReminders(
    scope: ReminderSyncScope = 'MONTH',
  ): Promise<{ scanned: number; created: number; scope: ReminderSyncScope }> {
    const now = new Date();
    const futureLimit = new Date(now);

    if (scope === 'DAY') {
      futureLimit.setDate(futureLimit.getDate() + 1);
    } else if (scope === 'WEEK') {
      futureLimit.setDate(futureLimit.getDate() + 7);
    } else if (scope === 'MONTH') {
      futureLimit.setMonth(futureLimit.getMonth() + 1);
    } else {
      futureLimit.setFullYear(futureLimit.getFullYear() + 1);
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gte: now,
          lte: futureLimit,
        },
      },
      include: {
        user: true,
        establishment: true,
        professional: true,
        service: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 1000,
    });

    let created = 0;

    for (const appointment of appointments) {
      created += await this.scheduleAppointmentReminders({
        appointmentId: appointment.id,
        clientName: appointment.user.name,
        clientEmail: appointment.user.email,
        clientPhone: appointment.user.phone,
        establishmentName: appointment.establishment.name,
        serviceName: appointment.service.name,
        professionalName: appointment.professional.name,
        scheduledAt: appointment.scheduledAt,
        price: appointment.price,
        durationMinutes: appointment.durationMinutes,
      });
    }

    return {
      scanned: appointments.length,
      created,
      scope,
    };
  }

  async listReminderHistory() {
    try {
      const reminders = await this.prisma.whatsAppReminder.findMany({
        include: {
          appointment: {
            include: {
              user: true,
              establishment: true,
              professional: true,
              service: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return reminders.map((reminder) => ({
        id: reminder.id,
        type: reminder.type,
        status: reminder.status,
        recipientPhone: reminder.recipientPhone,
        sendAt: reminder.sendAt,
        sentAt: reminder.sentAt,
        attempts: reminder.attempts,
        errorMessage: reminder.errorMessage,
        createdAt: reminder.createdAt,
        appointment: {
          id: reminder.appointment?.id || reminder.appointmentId,
          scheduledAt: reminder.appointment?.scheduledAt || null,
          status: reminder.appointment?.status || 'UNKNOWN',
          clientName: reminder.appointment?.user?.name || 'Cliente removido',
          establishmentName:
            reminder.appointment?.establishment?.name ||
            'Estabelecimento removido',
          professionalName:
            reminder.appointment?.professional?.name ||
            'Profissional removido',
          serviceName: reminder.appointment?.service?.name || 'Servico removido',
        },
      }));
    } catch (error) {
      this.logger.error(
        `Failed to load WhatsApp reminder history: ${this.stringifyError(error)}`,
      );
      return [];
    }
  }

  private async initializeConnection(forceReconnect = false): Promise<void> {
    if (this.initializing && !forceReconnect) {
      await this.initializing;
      return;
    }

    this.initializing = this.createSocket(forceReconnect);

    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private async createSocket(forceReconnect: boolean): Promise<void> {
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }

    if (forceReconnect && this.socket?.end) {
      this.socket.end(undefined);
      this.socket = null;
    }

    const baileys = await import('baileys');
    const { state, saveCreds } = await baileys.useMultiFileAuthState(
      this.authPath,
    );

    let version: [number, number, number] | undefined;
    try {
      const latest = await baileys.fetchLatestWaWebVersion();
      version = latest.version as [number, number, number];
    } catch (error) {
      this.logger.warn(
        `Unable to fetch latest WhatsApp Web version: ${this.stringifyError(error)}`,
      );
    }

    this.socket = baileys.default({
      auth: state,
      version,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      printQRInTerminal: false,
    });

    this.socket.ev.on('creds.update', saveCreds);
    this.socket.ev.on('connection.update', (update: any) => {
      void this.handleConnectionUpdate(update, baileys.DisconnectReason);
    });
    this.socket.ev.on('messages.upsert', (payload: any) => {
      void this.handleIncomingMessages(payload);
    });
  }

  private async handleConnectionUpdate(
    update: any,
    disconnectReason: any,
  ): Promise<void> {
    if (update.qr) {
      this.lastQr = update.qr;
      this.printQr(update.qr);
    }

    if (update.connection === 'open') {
      this.connectedJid = this.socket?.user?.id || null;
      this.lastQr = null;
      this.logger.log(`WhatsApp connected as ${this.connectedJid}`);
      return;
    }

    if (update.connection !== 'close') {
      return;
    }

    const statusCode =
      update.lastDisconnect?.error?.output?.statusCode ||
      update.lastDisconnect?.error?.data?.statusCode;
    const shouldReconnect = statusCode !== disconnectReason.loggedOut;

    this.connectedJid = null;
    this.logger.warn(
      `WhatsApp connection closed with code ${statusCode ?? 'unknown'}`,
    );

    if (shouldReconnect && this.isEnabled()) {
      await this.initializeConnection(true);
    }
  }

  private async handleIncomingMessages(payload: any): Promise<void> {
    if (!payload?.messages?.length) {
      return;
    }

    for (const message of payload.messages) {
      if (message.key?.fromMe || message.key?.remoteJid === 'status@broadcast') {
        continue;
      }

      const text = this.extractText(message);
      if (!text) {
        continue;
      }

      const sender = this.normalizePhone(
        String(message.key?.remoteJid || '').split('@')[0],
      );
      await this.processCommand(sender, text.trim());
    }
  }

  private async processCommand(senderPhone: string, text: string): Promise<void> {
    const normalized = text.toLowerCase();

    if (normalized === 'menu' || normalized === 'ajuda') {
      await this.sendTextMessage(senderPhone, this.buildHelpMessage());
      return;
    }

    if (
      normalized === 'sim' ||
      normalized === 'confirmado' ||
      normalized === 'vou' ||
      normalized === 'estarei ai' ||
      normalized === 'estarei aí' ||
      normalized === 'ok'
    ) {
      const confirmed = await this.tryConfirmNearestAppointment(senderPhone);
      if (confirmed) {
        return;
      }
    }

    if (normalized === 'meus agendamentos' || normalized === 'agendamentos') {
      await this.handleListAppointments(senderPhone);
      return;
    }

    if (normalized.startsWith('cadastro ')) {
      await this.handleRegister(senderPhone, text.slice('cadastro '.length));
      return;
    }

    if (normalized.startsWith('agendar ')) {
      await this.handleSchedule(senderPhone, text.slice('agendar '.length));
      return;
    }

    if (normalized.startsWith('cancelar ')) {
      await this.handleCancel(senderPhone, text.slice('cancelar '.length).trim());
      return;
    }

    if (normalized.startsWith('remarcar ')) {
      await this.handleReschedule(
        senderPhone,
        text.slice('remarcar '.length).trim(),
      );
      return;
    }

    await this.processConversationalMessage(senderPhone, text);
  }

  private async processConversationalMessage(
    senderPhone: string,
    text: string,
  ): Promise<void> {
    const session = this.getSession(senderPhone);
    const catalog = await this.loadCatalog();
    const intent = await this.whatsAppAiService.extractIntent(text, catalog);

    this.mergeSessionFromIntent(session, intent);

    if (intent.intent === 'register_user') {
      await this.handleConversationalRegister(senderPhone, session);
      return;
    }

    if (intent.intent === 'list_appointments') {
      await this.handleListAppointments(senderPhone);
      return;
    }

    if (intent.intent === 'list_services') {
      await this.handleListServices(senderPhone, session);
      return;
    }

    if (intent.intent === 'cancel_appointment') {
      await this.handleNaturalCancel(senderPhone, session, intent);
      return;
    }

    if (intent.intent === 'reschedule_appointment') {
      await this.handleNaturalReschedule(senderPhone, session, intent);
      return;
    }

    if (intent.intent === 'confirm_selection') {
      await this.handleConfirmationIntent(senderPhone, session);
      return;
    }

    if (intent.intent === 'general_help') {
      await this.sendTextMessage(senderPhone, this.buildConversationalHelpMessage());
      return;
    }

    if (
      intent.intent === 'check_availability' ||
      intent.intent === 'book_appointment' ||
      intent.intent === 'unknown'
    ) {
      await this.handleAiSchedulingFlow(senderPhone, session, text);
      return;
    }
  }

  private async handleConversationalRegister(
    senderPhone: string,
    session: ConversationSession,
  ): Promise<void> {
    if (!session.customerName || !session.customerEmail) {
      await this.sendTextMessage(
        senderPhone,
        'Para eu te cadastrar pelo WhatsApp, me envie assim: "meu nome e Ana Silva e meu email e ana@email.com".',
      );
      return;
    }

    await this.handleRegister(
      senderPhone,
      `${session.customerName} | ${session.customerEmail}`,
    );
  }

  private async handleAiSchedulingFlow(
    senderPhone: string,
    session: ConversationSession,
    originalText: string,
  ): Promise<void> {
    const establishment = session.establishmentSlug
      ? await this.prisma.establishment.findUnique({
          where: { slug: session.establishmentSlug },
          select: { id: true, name: true, slug: true },
        })
      : null;

    if (!establishment) {
      const establishments = await this.prisma.establishment.findMany({
        select: { slug: true, name: true },
        orderBy: { name: 'asc' },
        take: 5,
      });
      await this.sendTextMessage(
        senderPhone,
        [
          'Me fala em qual estabelecimento voce quer atendimento.',
          'Exemplos disponiveis:',
          ...establishments.map((item) => `- ${item.name} (${item.slug})`),
        ].join('\n'),
      );
      return;
    }

    const service = await this.resolveServiceForSession(establishment.id, session);
    if (!service) {
      const services = await this.prisma.service.findMany({
        where: { establishmentId: establishment.id },
        select: { name: true },
        orderBy: { name: 'asc' },
        take: 8,
      });
      await this.sendTextMessage(
        senderPhone,
        [
          `Entendi o estabelecimento ${establishment.name}.`,
          'Agora me diga o servico desejado.',
          'Exemplos:',
          ...services.map((item) => `- ${item.name}`),
        ].join('\n'),
      );
      return;
    }

    session.serviceId = service.id;
    session.serviceName = service.name;

    const professional = await this.resolveProfessionalForSession(service, session);
    if (professional) {
      session.professionalId = professional.id;
      session.professionalName = professional.name;
    } else {
      session.professionalId = service.professionalId;
    }

    if (!session.date) {
      const availableDates = await this.getAvailableDatesForService(
        establishment.slug,
        service.id,
        session.professionalId || service.professionalId,
      );

      await this.sendTextMessage(
        senderPhone,
        availableDates.length
          ? [
              `Encontrei o servico ${service.name}.`,
              'Me diga uma data. As proximas com disponibilidade sao:',
              ...availableDates.slice(0, 5).map((item) => `- ${item}`),
            ].join('\n')
          : `Nao achei datas disponiveis para ${service.name} nos proximos dias.`,
      );
      return;
    }

    const availableSlots = await this.getAvailableSlotsForService(
      establishment.slug,
      session.date,
      service.id,
      session.professionalId || service.professionalId,
    );
    session.lastSuggestedSlots = availableSlots;
    session.pendingAction = 'book';

    if (!availableSlots.length) {
      await this.sendTextMessage(
        senderPhone,
        `Nao encontrei horarios livres para ${service.name} em ${session.date}. Se quiser, me envie outra data.`,
      );
      return;
    }

    if (!session.time) {
      session.suggestedTime =
        (session.timePeriod &&
          this.findSlotByPeriod(availableSlots, session.timePeriod)) ||
        availableSlots[0];
      await this.sendTextMessage(
        senderPhone,
        [
          `Horarios disponiveis para ${service.name} em ${session.date}:`,
          ...availableSlots.slice(0, 8).map((slot) => `- ${slot}`),
          '',
          `Se quiser, posso marcar no horario sugerido: ${session.suggestedTime}.`,
          'Me responda com o horario ou diga "sim" para eu confirmar o sugerido.',
        ].join('\n'),
      );
      return;
    }

    const matchedSlot = this.matchRequestedTime(session.time, availableSlots);
    if (!matchedSlot) {
      await this.sendTextMessage(
        senderPhone,
        [
          `Nao achei o horario ${session.time} livre para ${service.name} em ${session.date}.`,
          'Os horarios disponiveis agora sao:',
          ...availableSlots.slice(0, 8).map((slot) => `- ${slot}`),
        ].join('\n'),
      );
      return;
    }

    const user = await this.findUserByPhone(senderPhone);
    if (!user) {
      await this.sendTextMessage(
        senderPhone,
        'Antes de concluir o agendamento, preciso do seu cadastro. Envie: "meu nome e Ana Silva e meu email e ana@email.com".',
      );
      return;
    }

    await this.handleSchedule(
      senderPhone,
      `${establishment.slug} | ${session.date} | ${matchedSlot} | ${service.id} | ${session.professionalId || service.professionalId}`,
    );

    session.time = matchedSlot;
    session.suggestedTime = matchedSlot;
    session.pendingAction = undefined;
    if (originalText.toLowerCase().includes('horario')) {
      this.conversationSessions.set(senderPhone, session);
    }
  }

  private async handleListServices(
    senderPhone: string,
    session: ConversationSession,
  ): Promise<void> {
    if (!session.establishmentSlug) {
      const establishments = await this.prisma.establishment.findMany({
        select: { slug: true, name: true },
        orderBy: { name: 'asc' },
        take: 5,
      });

      await this.sendTextMessage(
        senderPhone,
        [
          'Me diga o estabelecimento para eu listar os servicos.',
          ...establishments.map((item) => `- ${item.name} (${item.slug})`),
        ].join('\n'),
      );
      return;
    }

    const establishment = await this.prisma.establishment.findUnique({
      where: { slug: session.establishmentSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        services: {
          include: {
            professional: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!establishment) {
      await this.sendTextMessage(senderPhone, 'Estabelecimento nao encontrado.');
      return;
    }

    const lines = [`Servicos de ${establishment.name}:`];
    for (const service of establishment.services.slice(0, 12)) {
      lines.push(
        `- ${service.name} | ${this.formatCurrency(service.price)} | ${service.durationMinutes} min | ${service.professional.name}`,
      );
    }
    lines.push('');
    lines.push('Se quiser, me diga o nome do servico para eu buscar horarios.');

    await this.sendTextMessage(senderPhone, lines.join('\n'));
  }

  private async handleConfirmationIntent(
    senderPhone: string,
    session: ConversationSession,
  ): Promise<void> {
    if (session.pendingAction === 'book' && session.suggestedTime) {
      session.time = session.suggestedTime;
      await this.handleAiSchedulingFlow(senderPhone, session, 'sim');
      return;
    }

    if (session.pendingAction === 'reschedule' && session.suggestedTime) {
      session.time = session.suggestedTime;
      await this.handleNaturalReschedule(senderPhone, session, {
        intent: 'reschedule_appointment',
        establishmentSlug: session.establishmentSlug || '',
        serviceName: session.serviceName || '',
        professionalName: session.professionalName || '',
        date: session.date || '',
        time: session.time || '',
        customerName: session.customerName || '',
        customerEmail: session.customerEmail || '',
        appointmentCode: session.appointmentCode || '',
        timePeriod: session.timePeriod || '',
      });
      return;
    }

    const nextAppointment = await this.findNearestFutureAppointmentForPhone(
      senderPhone,
    );
    if (nextAppointment) {
      session.appointmentCode = nextAppointment.id;
      await this.sendTextMessage(
        senderPhone,
        [
          `Perfeito! Mantive confirmado o agendamento ${nextAppointment.id}.`,
          `Quando: ${this.formatDateTime(nextAppointment.scheduledAt)}`,
        ].join('\n'),
      );
      return;
    }

    await this.sendTextMessage(
      senderPhone,
      'Ainda nao tenho uma sugestao pronta para confirmar. Me diga o servico ou o agendamento que voce quer remarcar.',
    );
  }

  private async handleNaturalCancel(
    senderPhone: string,
    session: ConversationSession,
    intent: WhatsAppAiIntent,
  ): Promise<void> {
    if (intent.appointmentCode) {
      session.appointmentCode = intent.appointmentCode;
    }

    let appointmentId = session.appointmentCode;
    if (!appointmentId) {
      const nextAppointment = await this.findNearestFutureAppointmentForPhone(
        senderPhone,
      );

      if (!nextAppointment) {
        await this.sendTextMessage(
          senderPhone,
          'Nao achei agendamento futuro para cancelar. Se quiser, envie "meus agendamentos".',
        );
        return;
      }

      appointmentId = nextAppointment.id;
      session.appointmentCode = nextAppointment.id;
    }

    await this.handleCancel(senderPhone, appointmentId);
  }

  private async handleNaturalReschedule(
    senderPhone: string,
    session: ConversationSession,
    intent: WhatsAppAiIntent,
  ): Promise<void> {
    if (intent.appointmentCode) {
      session.appointmentCode = intent.appointmentCode;
    }

    let appointmentId = session.appointmentCode;
    if (!appointmentId) {
      const nextAppointment = await this.prisma.appointment.findFirst({
        where: {
          user: {
            phone: {
              endsWith: this.normalizePhone(senderPhone).slice(-11),
            },
          },
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      if (!nextAppointment) {
        await this.sendTextMessage(
          senderPhone,
          'Nao achei agendamento futuro para remarcar. Se quiser, envie "meus agendamentos".',
        );
        return;
      }

      appointmentId = nextAppointment.id;
      session.appointmentCode = nextAppointment.id;
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: true,
        service: true,
        professional: true,
        establishment: true,
      },
    });

    if (!appointment) {
      await this.sendTextMessage(senderPhone, 'Agendamento nao encontrado.');
      return;
    }

    session.establishmentSlug = appointment.establishment.slug;
    session.serviceId = appointment.serviceId;
    session.serviceName = appointment.service.name;
    session.professionalId = appointment.professionalId;
    session.professionalName = appointment.professional.name;

    if (intent.date) {
      session.date = intent.date;
    }
    if (intent.time) {
      session.time = intent.time;
    }
    if (intent.timePeriod) {
      session.timePeriod = intent.timePeriod as
        | 'morning'
        | 'afternoon'
        | 'evening';
    }

    if (!session.date) {
      const dates = await this.getAvailableDatesForService(
        appointment.establishment.slug,
        appointment.serviceId,
        appointment.professionalId,
      );
      await this.sendTextMessage(
        senderPhone,
        dates.length
          ? [
              `Vamos remarcar o agendamento ${appointment.id}.`,
              'Me diga a nova data. Sugestoes:',
              ...dates.map((item) => `- ${item}`),
            ].join('\n')
          : 'Nao achei novas datas disponiveis agora para esse servico.',
      );
      return;
    }

    const slots = await this.getAvailableSlotsForService(
      appointment.establishment.slug,
      session.date,
      appointment.serviceId,
      appointment.professionalId,
    );

    if (!slots.length) {
      await this.sendTextMessage(
        senderPhone,
        `Nao encontrei horarios disponiveis em ${session.date}. Me envie outra data.`,
      );
      return;
    }

    session.pendingAction = 'reschedule';
    session.lastSuggestedSlots = slots;
    session.suggestedTime =
      (session.timePeriod && this.findSlotByPeriod(slots, session.timePeriod)) ||
      slots[0];

    if (!session.time) {
      await this.sendTextMessage(
        senderPhone,
        [
          `Horarios livres para remarcar em ${session.date}:`,
          ...slots.slice(0, 8).map((item) => `- ${item}`),
          '',
          `Posso remarcar no horario sugerido: ${session.suggestedTime}. Responda "sim" ou me mande outro horario.`,
        ].join('\n'),
      );
      return;
    }

    const matchedSlot = this.matchRequestedTime(session.time, slots);
    if (!matchedSlot) {
      await this.sendTextMessage(
        senderPhone,
        [
          `O horario ${session.time} nao esta livre.`,
          'Os horarios disponiveis agora sao:',
          ...slots.slice(0, 8).map((item) => `- ${item}`),
        ].join('\n'),
      );
      return;
    }

    await this.handleReschedule(
      senderPhone,
      `${appointment.id} | ${session.date} | ${matchedSlot}`,
    );

    session.time = matchedSlot;
    session.pendingAction = undefined;
    session.suggestedTime = matchedSlot;
  }

  private async handleRegister(
    senderPhone: string,
    payload: string,
  ): Promise<void> {
    const [name, email] = payload.split('|').map((value) => value.trim());
    if (!name || !email) {
      await this.sendTextMessage(
        senderPhone,
        'Use: cadastro Nome Completo | email@dominio.com',
      );
      return;
    }

    const phone = this.normalizePhone(senderPhone);
    const existingByPhone = await this.findUserByPhone(phone);
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingByPhone) {
      await this.prisma.user.update({
        where: { id: existingByPhone.id },
        data: { name, email, phone },
      });
    } else if (existingByEmail) {
      await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: { name, phone },
      });
    } else {
      await this.prisma.user.create({
        data: {
          id: randomUUID(),
          name,
          email,
          phone,
        },
      });
    }

    await this.sendTextMessage(
      senderPhone,
      'Cadastro concluido. Agora voce pode pedir horarios ou marcar por mensagem, por exemplo: "quero ver horarios para manicure amanha no studio-x" ou "quero agendar limpeza de pele sexta as 14h".',
    );
  }

  private async handleSchedule(
    senderPhone: string,
    payload: string,
  ): Promise<void> {
    const session = this.getSession(senderPhone);
    const [slug, date, time, serviceId, professionalIdInput] = payload
      .split('|')
      .map((value) => value.trim());

    if (!slug || !date || !time || !serviceId) {
      await this.sendTextMessage(
        senderPhone,
        'Use: agendar slug-do-estabelecimento | AAAA-MM-DD | HH:mm | serviceId | [professionalId]',
      );
      return;
    }

    const user = await this.findUserByPhone(senderPhone);
    if (!user) {
      await this.sendTextMessage(
        senderPhone,
        'Antes de agendar, faca seu cadastro: cadastro Nome Completo | email@dominio.com',
      );
      return;
    }

    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        depositPercent: true,
        mercadoPagoAccountId: true,
      },
    });
    if (!establishment) {
      await this.sendTextMessage(senderPhone, 'Estabelecimento nao encontrado.');
      return;
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.establishmentId !== establishment.id) {
      await this.sendTextMessage(senderPhone, 'Servico nao encontrado.');
      return;
    }

    const professionalId = professionalIdInput || service.professionalId;
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
    });
    if (!professional || professional.establishmentId !== establishment.id) {
      await this.sendTextMessage(senderPhone, 'Profissional nao encontrado.');
      return;
    }

    const scheduledAt = this.parseLocalDateTime(date, time);
    if (!scheduledAt) {
      await this.sendTextMessage(
        senderPhone,
        'Data ou horario invalido. Use AAAA-MM-DD e HH:mm.',
      );
      return;
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

    const activeSubscription = await this.prisma.clientSubscription.findFirst({
      where: {
        userId: user.id,
        establishmentId: establishment.id,
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const hasSubscriptionCredits =
      !!activeSubscription &&
      activeSubscription.usedCredits < activeSubscription.totalCredits;

    await this.validateRescheduleSlot(
      professional.id,
      service.durationMinutes,
      scheduledAt,
    );

    const requiresDeposit =
      !hasSubscriptionCredits &&
      Boolean(establishment.depositPercent && establishment.depositPercent > 0);

    const appointment = await this.prisma.appointment.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        establishmentId: establishment.id,
        professionalId: professional.id,
        serviceId: service.id,
        scheduledAt,
        holdExpiresAt: requiresDeposit
          ? new Date(Date.now() + this.paymentHoldMinutes * 60 * 1000)
          : null,
        durationMinutes: service.durationMinutes,
        status: requiresDeposit ? 'PAYMENT_PENDING' : 'SCHEDULED',
        price: service.price,
      },
    });

    session.appointmentCode = appointment.id;
    session.establishmentSlug = establishment.slug;
    session.serviceId = service.id;
    session.serviceName = service.name;
    session.professionalId = professional.id;
    session.professionalName = professional.name;
    const scheduledAtParts = getSaoPauloTimeZoneParts(scheduledAt);
    session.date = getSaoPauloDateKey(scheduledAt);
    session.time = `${String(scheduledAtParts.hour).padStart(2, '0')}:${String(scheduledAtParts.minute).padStart(2, '0')}`;

    if (requiresDeposit) {
      try {
        const depositAmount = Number(
          (
            service.price *
            ((establishment.depositPercent || 0) / 100)
          ).toFixed(2),
        );

        const paymentLink =
          await this.createAppointmentPaymentLinkUseCase.execute({
            appointmentId: appointment.id,
            payerEmail: user.email,
            establishmentMercadoPagoId:
              establishment.mercadoPagoAccountId || undefined,
            amountOverride: depositAmount,
            descriptionOverride: `Sinal do agendamento - ${service.name}`,
            paymentType: 'DEPOSIT' as any,
          });

        await this.sendTextMessage(
          senderPhone,
          [
            'Recebi seu pedido e reservei esse horario temporariamente.',
            `Servico: ${service.name}`,
            `Profissional: ${professional.name}`,
            `Horario: ${this.formatDateTime(appointment.scheduledAt)}`,
            `Sinal para confirmar: ${this.formatCurrency(depositAmount)}`,
            `Validade da reserva: ${this.formatDateTime(appointment.holdExpiresAt || appointment.scheduledAt)}`,
            '',
            'Pague no link abaixo com PIX ou cartao para confirmar o agendamento:',
            paymentLink.paymentUrl || 'Link indisponivel no momento',
          ].join('\n'),
        );
      } catch (error) {
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'CANCELLED',
            holdExpiresAt: null,
          },
        });
        throw error;
      }

      return;
    }

    if (hasSubscriptionCredits && activeSubscription) {
      await this.prisma.clientSubscription.update({
        where: { id: activeSubscription.id },
        data: {
          usedCredits: {
            increment: 1,
          },
        },
      });
    }

    try {
      await this.sendAppointmentConfirmation({
        appointmentId: appointment.id,
        clientName: user.name,
        clientEmail: user.email,
        clientPhone: user.phone,
        establishmentName: establishment.name,
        serviceName: service.name,
        professionalName: professional.name,
        scheduledAt: appointment.scheduledAt,
        price: appointment.price,
        durationMinutes: appointment.durationMinutes,
      });
      await this.scheduleAppointmentReminders({
        appointmentId: appointment.id,
        clientName: user.name,
        clientEmail: user.email,
        clientPhone: user.phone,
        establishmentName: establishment.name,
        serviceName: service.name,
        professionalName: professional.name,
        scheduledAt: appointment.scheduledAt,
        price: appointment.price,
        durationMinutes: appointment.durationMinutes,
      });
    } catch (error) {
      this.logger.warn(
        `Appointment created but WhatsApp notification failed: ${this.stringifyError(error)}`,
      );
    }

    await this.sendTextMessage(
      senderPhone,
      [
        'Agendamento criado com sucesso.',
        `Codigo: ${appointment.id}`,
        `Quando: ${this.formatDateTime(appointment.scheduledAt)}`,
        `Servico: ${service.name}`,
        `Profissional: ${professional.name}`,
      ].join('\n'),
    );
  }

  private async handleListAppointments(senderPhone: string): Promise<void> {
    const user = await this.findUserByPhone(senderPhone);
    if (!user) {
      await this.sendTextMessage(
        senderPhone,
        'Nao encontrei seu cadastro. Envie: cadastro Nome Completo | email@dominio.com',
      );
      return;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        userId: user.id,
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      include: {
        establishment: true,
        professional: true,
        service: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    if (!appointments.length) {
      await this.sendTextMessage(
        senderPhone,
        'Voce nao tem agendamentos futuros no momento.',
      );
      return;
    }

    const lines = ['Seus proximos agendamentos:'];
    for (const appointment of appointments) {
      lines.push(
        [
          '',
          `Codigo: ${appointment.id}`,
          `Estabelecimento: ${appointment.establishment.name}`,
          `Servico: ${appointment.service.name}`,
          `Profissional: ${appointment.professional.name}`,
          `Quando: ${this.formatDateTime(appointment.scheduledAt)}`,
        ].join('\n'),
      );
    }

    const latest = appointments[0];
    const session = this.getSession(senderPhone);
    session.appointmentCode = latest.id;
    session.establishmentSlug = latest.establishment.slug;
    session.serviceId = latest.serviceId;
    session.serviceName = latest.service.name;
    session.professionalId = latest.professionalId;
    session.professionalName = latest.professional.name;
    const latestScheduledAtParts = getSaoPauloTimeZoneParts(latest.scheduledAt);
    session.date = getSaoPauloDateKey(latest.scheduledAt);
    session.time = `${String(latestScheduledAtParts.hour).padStart(2, '0')}:${String(latestScheduledAtParts.minute).padStart(2, '0')}`;

    await this.sendTextMessage(senderPhone, lines.join('\n'));
  }

  private async handleCancel(
    senderPhone: string,
    appointmentId: string,
  ): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: true,
      },
    });

    if (!appointment) {
      await this.sendTextMessage(senderPhone, 'Agendamento nao encontrado.');
      return;
    }

    const normalizedPhone = this.normalizePhone(senderPhone);
    if (this.normalizePhone(appointment.user.phone) !== normalizedPhone) {
      await this.sendTextMessage(
        senderPhone,
        'Esse agendamento nao pertence ao seu numero de WhatsApp.',
      );
      return;
    }

    await this.cancelAppointmentUseCase.execute({
      appointmentId,
      now: new Date(),
    });

    await this.markConfirmationReminderStatus(appointmentId, 'DECLINED');
    await this.cancelPendingReminders(appointmentId);

    await this.sendTextMessage(
      senderPhone,
      `Agendamento ${appointmentId} cancelado com sucesso.`,
    );

    const session = this.getSession(senderPhone);
    if (session.appointmentCode === appointmentId) {
      session.appointmentCode = undefined;
      session.pendingAction = undefined;
    }
  }

  private async handleReschedule(
    senderPhone: string,
    payload: string,
  ): Promise<void> {
    const [appointmentId, date, time] = payload
      .split('|')
      .map((value) => value.trim());

    if (!appointmentId || !date || !time) {
      await this.sendTextMessage(
        senderPhone,
        'Use: remarcar CODIGO_DO_AGENDAMENTO | AAAA-MM-DD | HH:mm',
      );
      return;
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: true,
        service: true,
        professional: true,
        establishment: true,
      },
    });

    if (!appointment) {
      await this.sendTextMessage(senderPhone, 'Agendamento nao encontrado.');
      return;
    }

    if (
      this.normalizePhone(appointment.user.phone) !==
      this.normalizePhone(senderPhone)
    ) {
      await this.sendTextMessage(
        senderPhone,
        'Esse agendamento nao pertence ao seu numero de WhatsApp.',
      );
      return;
    }

    const newScheduledAt = this.parseLocalDateTime(date, time);
    if (!newScheduledAt) {
      await this.sendTextMessage(
        senderPhone,
        'Data ou horario invalido. Use AAAA-MM-DD e HH:mm.',
      );
      return;
    }

    await this.validateRescheduleSlot(
      appointment.professionalId,
      appointment.durationMinutes,
      newScheduledAt,
      appointment.id,
    );

    const previousScheduledAt = appointment.scheduledAt;

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt: newScheduledAt,
        status: 'SCHEDULED',
      },
    });

    await this.markConfirmationReminderStatus(appointment.id, 'RESCHEDULED');
    await this.cancelPendingReminders(appointment.id);
    await this.scheduleAppointmentReminders({
      appointmentId: appointment.id,
      clientName: appointment.user.name,
      clientEmail: appointment.user.email,
      clientPhone: appointment.user.phone,
      establishmentName: appointment.establishment.name,
      serviceName: appointment.service.name,
      professionalName: appointment.professional.name,
      scheduledAt: newScheduledAt,
      price: appointment.price,
      durationMinutes: appointment.durationMinutes,
    });

    await this.sendTextMessage(
      senderPhone,
      [
        `Agendamento ${appointment.id} remarcado com sucesso.`,
        `Antes: ${this.formatDateTime(previousScheduledAt)}`,
        `Agora: ${this.formatDateTime(newScheduledAt)}`,
      ].join('\n'),
    );

    const session = this.getSession(senderPhone);
    session.appointmentCode = appointment.id;
    const newScheduledAtParts = getSaoPauloTimeZoneParts(newScheduledAt);
    session.date = getSaoPauloDateKey(newScheduledAt);
    session.time = `${String(newScheduledAtParts.hour).padStart(2, '0')}:${String(newScheduledAtParts.minute).padStart(2, '0')}`;
    session.pendingAction = undefined;
  }

  private async validateRescheduleSlot(
    professionalId: string,
    durationMinutes: number,
    scheduledAt: Date,
    ignoreAppointmentId?: string,
  ): Promise<void> {
    const dayOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][getSaoPauloDayOfWeek(scheduledAt)];
    const scheduledEnd = new Date(
      scheduledAt.getTime() + durationMinutes * 60 * 1000,
    );

    const schedules = await this.prisma.schedule.findMany({
      where: {
        professionalId,
        dayOfWeek,
        isAvailable: true,
      },
    });

    if (!schedules.length) {
      throw new Error('Professional has no availability for this day');
    }

    const fitsInSchedule = schedules.some((schedule) => {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      const scheduleStart = startHour * 60 + startMinute;
      const scheduleEnd = endHour * 60 + endMinute;
      const appointmentStart = getSaoPauloMinutes(scheduledAt);
      const appointmentEnd = getSaoPauloMinutes(scheduledEnd);

      return appointmentStart >= scheduleStart && appointmentEnd <= scheduleEnd;
    });

    if (!fitsInSchedule) {
      throw new Error('Appointment outside professional schedule');
    }

    const { start: dayStart, end: dayEnd } = getSaoPauloDayBounds(scheduledAt);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        ...(ignoreAppointmentId
          ? { id: { not: ignoreAppointmentId } }
          : {}),
        status: 'SCHEDULED',
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    const overlaps = existingAppointments.some((appointment) => {
      const existingEnd = new Date(
        appointment.scheduledAt.getTime() +
          appointment.durationMinutes * 60 * 1000,
      );
      return scheduledAt < existingEnd && scheduledEnd > appointment.scheduledAt;
    });

    if (overlaps) {
      throw new Error('Professional is not available at this time');
    }
  }

  private async cancelPendingReminders(appointmentId: string): Promise<void> {
    await this.prisma.whatsAppReminder.updateMany({
      where: {
        appointmentId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  private async markConfirmationReminderStatus(
    appointmentId: string,
    status: string,
  ): Promise<void> {
    await this.prisma.whatsAppReminder.updateMany({
      where: {
        appointmentId,
        type: 'CONFIRMATION_24H',
        status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
      },
      data: {
        status,
      },
    });
  }

  private buildReminderSchedule(scheduledAt: Date) {
    const now = Date.now();
    const candidates: Array<{
      type: AppointmentReminderType;
      sendAt: Date;
    }> = [
      {
        type: 'REMINDER_30D' as AppointmentReminderType,
        sendAt: new Date(scheduledAt.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'REMINDER_7D' as AppointmentReminderType,
        sendAt: new Date(scheduledAt.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'CONFIRMATION_24H',
        sendAt: new Date(
          scheduledAt.getTime() -
            this.confirmationLeadHours * 60 * 60 * 1000,
        ),
      },
      {
        type: 'REMINDER_24H',
        sendAt: new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        type: 'REMINDER_2H',
        sendAt: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
      },
    ];

    return candidates.filter((candidate) => candidate.sendAt.getTime() > now);
  }

  private buildReminderMessage(
    type: string,
    data: AppointmentNotificationData,
  ): string {
    const header =
      type === 'REMINDER_30D'
        ? 'Lembrete do seu agendamento no proximo mes.'
        : type === 'REMINDER_7D'
          ? 'Lembrete do seu agendamento na proxima semana.'
          : type === 'CONFIRMATION_24H'
            ? 'Confirme sua presenca no agendamento de amanha.'
          : type === 'REMINDER_24H'
            ? 'Lembrete do seu agendamento para amanha.'
            : 'Lembrete do seu agendamento nas proximas horas.';

    return [
      `Ola ${data.clientName}!`,
      '',
      header,
      `Estabelecimento: ${data.establishmentName}`,
      `Servico: ${data.serviceName}`,
      `Profissional: ${data.professionalName}`,
      `Quando: ${this.formatDateTime(data.scheduledAt)}`,
      `Codigo: ${data.appointmentId}`,
      '',
      type === 'CONFIRMATION_24H'
        ? 'Responda "sim" para confirmar presenca. Se nao puder comparecer, responda "nao vou" ou "remarcar CODIGO | AAAA-MM-DD | HH:mm".'
        : 'Se nao puder comparecer, responda por aqui com "nao vou", "cancelar CODIGO" ou "remarcar CODIGO | AAAA-MM-DD | HH:mm".',
    ].join('\n');
  }

  private async findNearestFutureAppointmentForPhone(senderPhone: string) {
    return this.prisma.appointment.findFirst({
      where: {
        user: {
          phone: {
            endsWith: this.normalizePhone(senderPhone).slice(-11),
          },
        },
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        user: true,
        service: true,
        professional: true,
        establishment: true,
      },
    });
  }

  private async tryConfirmNearestAppointment(
    senderPhone: string,
  ): Promise<boolean> {
    const appointment = await this.findNearestFutureAppointmentForPhone(
      senderPhone,
    );

    if (!appointment) {
      return false;
    }

    const confirmationReminder = await this.prisma.whatsAppReminder.findFirst({
      where: {
        appointmentId: appointment.id,
        type: 'CONFIRMATION_24H',
        status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
      },
      orderBy: { sendAt: 'desc' },
    });

    if (!confirmationReminder) {
      return false;
    }

    await this.prisma.whatsAppReminder.update({
      where: { id: confirmationReminder.id },
      data: {
        status: 'CONFIRMED',
        errorMessage: null,
      },
    });

    const session = this.getSession(senderPhone);
    session.appointmentCode = appointment.id;

    await this.sendTextMessage(
      senderPhone,
      [
        `Presenca confirmada para o agendamento ${appointment.id}.`,
        `Quando: ${this.formatDateTime(appointment.scheduledAt)}`,
      ].join('\n'),
    );

    return true;
  }

  private getSession(senderPhone: string): ConversationSession {
    const current = this.conversationSessions.get(senderPhone) || {};
    this.conversationSessions.set(senderPhone, current);
    return current;
  }

  private mergeSessionFromIntent(
    session: ConversationSession,
    intent: WhatsAppAiIntent,
  ): void {
    if (intent.establishmentSlug) {
      session.establishmentSlug = intent.establishmentSlug;
    }
    if (intent.serviceName) {
      session.serviceName = intent.serviceName;
    }
    if (intent.professionalName) {
      session.professionalName = intent.professionalName;
    }
    if (intent.date) {
      session.date = intent.date;
    }
    if (intent.time) {
      session.time = intent.time;
    }
    if (intent.customerName) {
      session.customerName = intent.customerName;
    }
    if (intent.customerEmail) {
      session.customerEmail = intent.customerEmail;
    }
    if (intent.appointmentCode) {
      session.appointmentCode = intent.appointmentCode;
    }
  }

  private async loadCatalog() {
    const establishments = await this.prisma.establishment.findMany({
      select: {
        slug: true,
        name: true,
        services: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
            professionalId: true,
            professional: {
              select: { name: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
      take: 10,
    });

    return establishments.map((item) => ({
      slug: item.slug,
      name: item.name,
      services: item.services.map((service) => ({
        id: service.id,
        name: service.name,
        professionalId: service.professionalId,
        professionalName: service.professional.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
      })),
    }));
  }

  private async resolveServiceForSession(
    establishmentId: string,
    session: ConversationSession,
  ) {
    if (session.serviceId) {
      const byId = await this.prisma.service.findUnique({
        where: { id: session.serviceId },
      });
      if (byId && byId.establishmentId === establishmentId) {
        return byId;
      }
    }

    if (!session.serviceName) {
      return null;
    }

    const services = await this.prisma.service.findMany({
      where: { establishmentId },
      orderBy: { name: 'asc' },
    });

    return (
      services.find((item) => this.normalizeText(item.name) === this.normalizeText(session.serviceName || '')) ||
      services.find((item) =>
        this.normalizeText(item.name).includes(
          this.normalizeText(session.serviceName || ''),
        ),
      ) ||
      null
    );
  }

  private async resolveProfessionalForSession(
    service: {
      professionalId: string;
      establishmentId: string;
    },
    session: ConversationSession,
  ) {
    if (session.professionalId) {
      const byId = await this.prisma.professional.findUnique({
        where: { id: session.professionalId },
      });
      if (byId && byId.establishmentId === service.establishmentId) {
        return byId;
      }
    }

    if (!session.professionalName) {
      return null;
    }

    const professionals = await this.prisma.professional.findMany({
      where: { establishmentId: service.establishmentId },
      orderBy: { name: 'asc' },
    });

    return (
      professionals.find(
        (item) =>
          this.normalizeText(item.name) ===
          this.normalizeText(session.professionalName || ''),
      ) ||
      professionals.find((item) =>
        this.normalizeText(item.name).includes(
          this.normalizeText(session.professionalName || ''),
        ),
      ) ||
      null
    );
  }

  private async getAvailableDatesForService(
    establishmentSlug: string,
    serviceId: string,
    professionalId: string,
  ): Promise<string[]> {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug: establishmentSlug },
      select: { id: true, slug: true },
    });
    if (!establishment) {
      return [];
    }

    const schedules = await this.prisma.schedule.findMany({
      where: {
        professionalId,
        isAvailable: true,
      },
    });

    if (!schedules.length) {
      return [];
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return [];
    }

    const todayDateKey = getSaoPauloTodayDateKey();
    const availableDates: string[] = [];

    for (let i = 0; i < 14; i += 1) {
      const checkDate = addDaysToDateKey(todayDateKey, i);
      const slots = await this.getAvailableSlotsForService(
        establishment.slug,
        checkDate,
        service.id,
        professionalId,
      );
      if (slots.length) {
        availableDates.push(checkDate);
      }
      if (availableDates.length >= 5) {
        break;
      }
    }

    return availableDates;
  }

  private async getAvailableSlotsForService(
    establishmentSlug: string,
    date: string,
    serviceId: string,
    professionalId: string,
  ): Promise<string[]> {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug: establishmentSlug },
      select: { id: true },
    });
    if (!establishment) {
      return [];
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return [];
    }

    const dayOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][getDayOfWeekFromDateKey(date)];

    const schedules = await this.prisma.schedule.findMany({
      where: {
        professionalId,
        dayOfWeek,
        isAvailable: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (!schedules.length) {
      return [];
    }

    const { start: dayStart, end: dayEnd } = getSaoPauloDayBoundsFromDateKey(date);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        OR: [
          { status: 'SCHEDULED' },
          {
            status: 'PAYMENT_PENDING',
            holdExpiresAt: {
              gt: new Date(),
            },
          },
        ],
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const slots: string[] = [];

    for (const schedule of schedules) {
      const startMinutes = toMinutes(schedule.startTime);
      const endMinutes = toMinutes(schedule.endTime);

      for (
        let minute = startMinutes;
        minute + service.durationMinutes <= endMinutes;
        minute += 15
      ) {
        const slotStart = parseSaoPauloDateTime(
          date,
          `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
        );
        const slotEnd = new Date(
          slotStart.getTime() + service.durationMinutes * 60 * 1000,
        );

        if (slotStart < new Date()) {
          continue;
        }

        const conflict = existingAppointments.some((appointment) => {
          const appointmentEnd = new Date(
            appointment.scheduledAt.getTime() +
              appointment.durationMinutes * 60 * 1000,
          );
          return slotStart < appointmentEnd && slotEnd > appointment.scheduledAt;
        });

        if (!conflict) {
          const slotParts = getSaoPauloTimeZoneParts(slotStart);
          slots.push(
            `${String(slotParts.hour).padStart(2, '0')}:${String(slotParts.minute).padStart(2, '0')}`,
          );
        }
      }
    }

    return [...new Set(slots)];
  }

  private matchRequestedTime(
    requestedTime: string,
    availableSlots: string[],
  ): string | null {
    if (availableSlots.includes(requestedTime)) {
      return requestedTime;
    }

    const normalizedRequested = requestedTime.replace(':', '');
    return (
      availableSlots.find(
        (slot) => slot.replace(':', '') === normalizedRequested,
      ) || null
    );
  }

  private findSlotByPeriod(
    availableSlots: string[],
    period: 'morning' | 'afternoon' | 'evening',
  ): string | null {
    const periodRanges = {
      morning: { start: 6, end: 11 },
      afternoon: { start: 12, end: 17 },
      evening: { start: 18, end: 22 },
    };

    const range = periodRanges[period];
    return (
      availableSlots.find((slot) => {
        const [hours] = slot.split(':').map(Number);
        return hours >= range.start && hours <= range.end;
      }) || null
    );
  }

  private buildConversationalHelpMessage(): string {
    return [
      'Posso atender voce por mensagem.',
      'Exemplos:',
      '- "quero ver horarios para manicure amanha no studio-x"',
      '- "quero agendar limpeza de pele no studio-x sexta as 14h"',
      '- "quais servicos voces tem no studio-x"',
      '- "sim" para confirmar o primeiro horario sugerido',
      '- "quero remarcar para amanha a tarde"',
      '- "meus agendamentos"',
      '- "cancelar CODIGO"',
    ].join('\n');
  }

  private async sendTextMessage(
    phone: string | undefined,
    text: string,
  ): Promise<void> {
    if (!phone) {
      throw new Error('Phone not informed');
    }

    const normalizedPhone = this.normalizePhone(phone);
    const simulatedMessages = this.simulatedOutbox.get(normalizedPhone);
    if (simulatedMessages) {
      simulatedMessages.push(text);
      this.simulatedOutbox.set(normalizedPhone, simulatedMessages);
      return;
    }

    if (!this.isEnabled()) {
      throw new Error('WhatsApp Baileys integration is disabled');
    }

    await this.initializeConnection();

    if (!this.socket) {
      throw new Error('WhatsApp socket not initialized');
    }

    const jid = `${normalizedPhone}@s.whatsapp.net`;
    await this.socket.sendMessage(jid, { text });
  }

  private buildHelpMessage(): string {
    return [
      'Comandos disponiveis:',
      'cadastro Nome Completo | email@dominio.com',
      'agendar slug-do-estabelecimento | AAAA-MM-DD | HH:mm | serviceId | [professionalId]',
      'meus agendamentos',
      'cancelar CODIGO_DO_AGENDAMENTO',
      'remarcar CODIGO_DO_AGENDAMENTO | AAAA-MM-DD | HH:mm',
      '',
      'Tambem pode falar naturalmente, por exemplo:',
      '"quero ver horarios para manicure amanha no studio-x"',
    ].join('\n');
  }

  private startReminderWorker(): void {
    if (this.reminderTimer) {
      return;
    }

    this.reminderTimer = setInterval(() => {
      void this.cleanupExpiredPendingAppointments().catch((error) => {
        this.logger.error(
          `Pending payment cleanup failed: ${this.stringifyError(error)}`,
        );
      });
      void this.autoCancelUnconfirmedAppointments().catch((error) => {
        this.logger.error(
          `Unconfirmed appointment cleanup failed: ${this.stringifyError(error)}`,
        );
      });
      void this.processDueReminders().catch((error) => {
        this.logger.error(
          `Reminder worker failed: ${this.stringifyError(error)}`,
        );
      });
    }, this.reminderIntervalMs);
  }

  private async cleanupExpiredPendingAppointments(): Promise<void> {
    const expiredAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'PAYMENT_PENDING',
        holdExpiresAt: {
          lte: new Date(),
        },
      },
      select: { id: true },
      take: 50,
    });

    if (!expiredAppointments.length) {
      return;
    }

    const ids = expiredAppointments.map((item) => item.id);

    await this.prisma.appointment.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'CANCELLED',
        holdExpiresAt: null,
      },
    });

    await this.prisma.payment.updateMany({
      where: {
        appointmentId: { in: ids },
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
        updatedAt: new Date(),
      },
    });
  }

  private async autoCancelUnconfirmedAppointments(): Promise<void> {
    const now = new Date();
    const deadline = new Date(
      now.getTime() + this.confirmationDeadlineHours * 60 * 60 * 1000,
    );

    const reminders = await this.prisma.whatsAppReminder.findMany({
      where: {
        type: 'CONFIRMATION_24H',
        status: 'SENT',
        appointment: {
          status: 'SCHEDULED',
          scheduledAt: {
            gte: now,
            lte: deadline,
          },
        },
      },
      include: {
        appointment: {
          include: {
            user: true,
          },
        },
      },
      take: 50,
    });

    for (const reminder of reminders) {
      await this.cancelAppointmentUseCase.execute({
        appointmentId: reminder.appointmentId,
        now,
      });

      await this.prisma.whatsAppReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'AUTO_CANCELLED',
          errorMessage: 'Cancelled automatically because the customer did not confirm attendance in time.',
        },
      });

      await this.cancelPendingReminders(reminder.appointmentId);

      await this.sendTextMessage(
        reminder.recipientPhone,
        [
          `O agendamento ${reminder.appointmentId} foi cancelado automaticamente por falta de confirmacao.`,
          'Se quiser, responda aqui para remarcar.',
        ].join('\n'),
      ).catch((error) => {
        this.logger.warn(
          `Failed to send automatic cancellation notice: ${this.stringifyError(error)}`,
        );
      });
    }
  }

  private extractText(message: any): string {
    return (
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption ||
      message.message?.videoMessage?.caption ||
      ''
    );
  }

  private findUserByPhone(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const suffix =
      normalizedPhone.length > 11
        ? normalizedPhone.slice(normalizedPhone.length - 11)
        : normalizedPhone;

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: { endsWith: suffix } },
        ],
      },
    });
  }

  private parseLocalDateTime(date: string, time: string): Date | null {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const [hours, minutes] = time.split(':').map(Number);
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    parsed.setHours(hours, minutes, 0, 0);
    return parsed;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) {
      return digits;
    }

    if (digits.startsWith('55')) {
      return digits;
    }

    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }

    return digits;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private printQr(qr: string): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const qrcodeTerminal = require('qrcode-terminal');
      qrcodeTerminal.generate(qr, { small: true });
    } catch (error) {
      this.logger.warn(
        `Unable to render QR in terminal: ${this.stringifyError(error)}`,
      );
      this.logger.log(`WhatsApp QR: ${qr}`);
    }
  }

  private isEnabled(): boolean {
    return process.env.WHATSAPP_BAILEYS_ENABLED === 'true';
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
