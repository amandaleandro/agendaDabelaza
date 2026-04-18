import { Injectable, Logger } from '@nestjs/common';

type CatalogEstablishment = {
  slug: string;
  name: string;
  services: Array<{
    id: string;
    name: string;
    professionalId: string;
    professionalName: string;
    durationMinutes: number;
    price: number;
  }>;
};

export type WhatsAppAiIntent = {
  intent:
    | 'book_appointment'
    | 'check_availability'
    | 'register_user'
    | 'list_appointments'
    | 'list_services'
    | 'confirm_selection'
    | 'reschedule_appointment'
    | 'cancel_appointment'
    | 'general_help'
    | 'unknown';
  establishmentSlug: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  appointmentCode: string;
  timePeriod: string;
};

@Injectable()
export class WhatsAppAiService {
  private readonly logger = new Logger(WhatsAppAiService.name);

  async extractIntent(
    message: string,
    catalog: CatalogEstablishment[],
  ): Promise<WhatsAppAiIntent> {
    if (this.hasApiKey()) {
      try {
        return await this.extractWithOpenAi(message, catalog);
      } catch (error) {
        this.logger.warn(
          `OpenAI extraction failed, using local fallback: ${this.stringifyError(error)}`,
        );
      }
    }

    return this.extractHeuristically(message, catalog);
  }

  private async extractWithOpenAi(
    message: string,
    catalog: CatalogEstablishment[],
  ): Promise<WhatsAppAiIntent> {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: [
                  'Voce extrai intencao de mensagens de WhatsApp para agendamento de servicos.',
                  'Retorne somente os campos do schema.',
                  'Se nao souber algum campo, retorne string vazia.',
                  'Use datas absolutas no formato AAAA-MM-DD e horarios HH:mm quando presentes.',
                ].join(' '),
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `Mensagem do cliente: ${message}`,
                  '',
                  `Catalogo resumido: ${JSON.stringify(catalog)}`,
                ].join('\n'),
              },
            ],
          },
        ],
        max_output_tokens: 300,
        text: {
          format: {
            type: 'json_schema',
            name: 'whatsapp_intent',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                intent: {
                  type: 'string',
                  enum: [
                    'book_appointment',
                    'check_availability',
                    'register_user',
                    'list_appointments',
                    'list_services',
                    'confirm_selection',
                    'reschedule_appointment',
                    'cancel_appointment',
                    'general_help',
                    'unknown',
                  ],
                },
                establishmentSlug: { type: 'string' },
                serviceName: { type: 'string' },
                professionalName: { type: 'string' },
                date: { type: 'string' },
                time: { type: 'string' },
                customerName: { type: 'string' },
                customerEmail: { type: 'string' },
                appointmentCode: { type: 'string' },
                timePeriod: { type: 'string' },
              },
              required: [
                'intent',
                'establishmentSlug',
                'serviceName',
                'professionalName',
                'date',
                'time',
                'customerName',
                'customerEmail',
                'appointmentCode',
                'timePeriod',
              ],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as any;
    const outputText =
      payload.output_text ||
      payload.output?.[0]?.content?.find((item: any) => item.type === 'output_text')
        ?.text;

    if (!outputText) {
      throw new Error('OpenAI response did not contain structured output text');
    }

    return JSON.parse(outputText) as WhatsAppAiIntent;
  }

  private extractHeuristically(
    message: string,
    catalog: CatalogEstablishment[],
  ): WhatsAppAiIntent {
    const normalized = this.normalize(message);
    const establishment = catalog.find(
      (item) =>
        normalized.includes(this.normalize(item.slug)) ||
        normalized.includes(this.normalize(item.name)),
    );
    const allServices = catalog.flatMap((item) =>
      item.services.map((service) => ({
        ...service,
        establishmentSlug: item.slug,
      })),
    );
    const service = allServices.find((item) =>
      normalized.includes(this.normalize(item.name)),
    );
    const professional = service
      ? null
      : allServices.find((item) =>
          normalized.includes(this.normalize(item.professionalName)),
        );

    const date = this.extractDate(normalized);
    const time = this.extractTime(normalized);
    const timePeriod = this.extractTimePeriod(normalized);
    const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    let intent: WhatsAppAiIntent['intent'] = 'unknown';

    if (
      normalized.includes('horario') ||
      normalized.includes('horarios') ||
      normalized.includes('dispon') ||
      normalized.includes('vaga')
    ) {
      intent = 'check_availability';
    }

    if (
      normalized.includes('agendar') ||
      normalized.includes('marcar') ||
      normalized.includes('quero esse horario') ||
      (time && (normalized.includes('pode ser') || normalized.includes('esse horario')))
    ) {
      intent = 'book_appointment';
    }

    if (
      normalized.includes('cadastro') ||
      normalized.includes('meu nome') ||
      Boolean(emailMatch)
    ) {
      intent = 'register_user';
    }

    if (normalized.includes('meus agendamentos')) {
      intent = 'list_appointments';
    }

    if (
      normalized.includes('servicos') ||
      normalized.includes('serviços') ||
      normalized.includes('o que voces fazem') ||
      normalized.includes('o que vocês fazem')
    ) {
      intent = 'list_services';
    }

    if (
      normalized === 'sim' ||
      normalized === 'pode marcar' ||
      normalized === 'confirmo' ||
      normalized === 'fechado' ||
      normalized.includes('pode confirmar')
    ) {
      intent = 'confirm_selection';
    }

    if (normalized.includes('remarcar') || normalized.includes('mudar horario')) {
      intent = 'reschedule_appointment';
    }

    if (normalized.includes('cancelar')) {
      intent = 'cancel_appointment';
    }

    if (normalized.includes('ajuda') || normalized.includes('menu')) {
      intent = 'general_help';
    }

    return {
      intent,
      establishmentSlug:
        establishment?.slug || service?.establishmentSlug || professional?.establishmentSlug || '',
      serviceName: service?.name || '',
      professionalName: service?.professionalName || professional?.professionalName || '',
      date,
      time,
      customerName: this.extractName(message),
      customerEmail: emailMatch?.[0] || '',
      appointmentCode: this.extractAppointmentCode(message),
      timePeriod,
    };
  }

  private extractDate(message: string): string {
    const isoMatch = message.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (isoMatch) {
      return isoMatch[1];
    }

    const brMatch = message.match(/\b(\d{2})\/(\d{2})(?:\/(20\d{2}))?\b/);
    if (brMatch) {
      const currentYear = new Date().getFullYear();
      const year = Number(brMatch[3] || currentYear);
      const month = brMatch[2];
      const day = brMatch[1];
      return `${year}-${month}-${day}`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (message.includes('amanha')) {
      today.setDate(today.getDate() + 1);
      return today.toISOString().split('T')[0];
    }

    if (message.includes('hoje')) {
      return today.toISOString().split('T')[0];
    }

    return '';
  }

  private extractTime(message: string): string {
    const hhmmMatch = message.match(/\b(\d{1,2}):(\d{2})\b/);
    if (hhmmMatch) {
      return `${hhmmMatch[1].padStart(2, '0')}:${hhmmMatch[2]}`;
    }

    const hourMatch = message.match(/\b(\d{1,2})h(?:\s*(\d{2}))?\b/);
    if (hourMatch) {
      const hours = hourMatch[1].padStart(2, '0');
      const minutes = (hourMatch[2] || '00').padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    return '';
  }

  private extractName(message: string): string {
    const match = message.match(/(?:meu nome e|sou a|sou o|nome)\s+([A-Za-zÀ-ÿ ]{3,})/i);
    return match?.[1]?.trim() || '';
  }

  private extractTimePeriod(message: string): string {
    if (message.includes('manha') || message.includes('manhã')) {
      return 'morning';
    }
    if (message.includes('tarde')) {
      return 'afternoon';
    }
    if (
      message.includes('noite') ||
      message.includes('fim do dia') ||
      message.includes('final do dia')
    ) {
      return 'evening';
    }
    return '';
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private extractAppointmentCode(message: string): string {
    const uuidMatch = message.match(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    );
    if (uuidMatch) {
      return uuidMatch[0];
    }

    const genericCodeMatch = message.match(/\b[a-z0-9]{8,}\b/i);
    return genericCodeMatch?.[0] || '';
  }

  private hasApiKey(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
