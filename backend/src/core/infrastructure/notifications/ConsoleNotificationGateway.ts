import {
  NotificationGateway,
  AppointmentNotificationData,
} from '../../domain/gateways/NotificationGateway';

export class ConsoleNotificationGateway implements NotificationGateway {
  async sendAppointmentConfirmationEmail(
    data: AppointmentNotificationData,
  ): Promise<void> {
    console.log('\n📧 ========== EMAIL CONFIRMAÇÃO ==========');
    console.log(`Para: ${data.clientEmail}`);
    console.log(`Assunto: Agendamento Confirmado - ${data.establishmentName}`);
    console.log('\n--- Corpo do Email ---');
    console.log(`Olá ${data.clientName},\n`);
    console.log(
      `Seu agendamento foi confirmado com sucesso! ✅\n`,
    );
    console.log('Detalhes do Agendamento:');
    console.log(`• Estabelecimento: ${data.establishmentName}`);
    console.log(`• Profissional: ${data.professionalName}`);
    console.log(`• Serviço: ${data.serviceName}`);
    console.log(
      `• Data/Hora: ${data.scheduledAt.toLocaleDateString('pt-BR')} às ${data.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    );
    console.log(`• Duração: ${data.durationMinutes} minutos`);
    console.log(`• Valor: R$ ${data.price.toFixed(2)}\n`);
    console.log(`Código do Agendamento: ${data.appointmentId}\n`);
    console.log('Até breve! 🎉');
    console.log('========================================\n');
  }

  async sendAppointmentConfirmationWhatsApp(
    data: AppointmentNotificationData,
  ): Promise<void> {
    if (!data.clientPhone) {
      console.log('⚠️  WhatsApp: Telefone não informado, mensagem não enviada');
      return;
    }

    const phoneFormatted = data.clientPhone.replace(/\D/g, '');

    console.log('\n💬 ========== WHATSAPP CONFIRMAÇÃO ==========');
    console.log(`Para: ${phoneFormatted} (${data.clientPhone})`);
    console.log('\n--- Mensagem ---');
    console.log(`Olá *${data.clientName}*! 👋\n`);
    console.log(`Seu agendamento foi *confirmado* com sucesso! ✅\n`);
    console.log('📋 *Detalhes do Agendamento:*');
    console.log(`🏢 Estabelecimento: ${data.establishmentName}`);
    console.log(`👤 Profissional: ${data.professionalName}`);
    console.log(`✂️ Serviço: ${data.serviceName}`);
    console.log(
      `📅 Data/Hora: ${data.scheduledAt.toLocaleDateString('pt-BR')} às ${data.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    );
    console.log(`⏱️ Duração: ${data.durationMinutes} minutos`);
    console.log(`💰 Valor: R$ ${data.price.toFixed(2)}\n`);
    console.log(`🔖 Código: ${data.appointmentId}\n`);
    console.log('Até logo! 🎉');
    console.log('==========================================\n');

    // Em produção, aqui seria integrado com API do WhatsApp
    // Exemplo: Twilio, WhatsApp Business API, etc.
    console.log(
      '📱 Em produção: Mensagem seria enviada via API do WhatsApp',
    );
  }
}
