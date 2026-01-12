import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash da senha "senha123"
  const hashedPassword = await hash('senha123', 8);

  // Create or update test owner (dono)
  const owner = await prisma.owner.upsert({
    where: { email: 'admin@agendei.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      id: randomUUID(),
      name: 'Maria Proprietária',
      email: 'admin@agendei.com',
      password: hashedPassword,
      phone: '(11) 97777-7777',
    },
  });

  console.log('✅ Owner ready:', owner.email);

  // Create or update test establishment
  const establishment = await prisma.establishment.upsert({
    where: { slug: 'salao-da-maria' },
    update: {
      name: 'Salão da Maria',
      bio: 'Seu salão de beleza preferido',
      depositPercent: 30,
    },
    create: {
      id: randomUUID(),
      name: 'Salão da Maria',
      slug: 'salao-da-maria',
      ownerId: owner.id,
      primaryColor: '#FF69B4',
      secondaryColor: '#333333',
      bio: 'Seu salão de beleza preferido',
      depositPercent: 30,
    },
  });

  console.log('✅ Establishment ready:', establishment.slug);

  // Create or update test user (cliente) com senha
  const user = await prisma.user.upsert({
    where: { email: 'joao@example.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      id: randomUUID(),
      name: 'João Silva',
      email: 'joao@example.com',
      password: hashedPassword,
      phone: '(11) 99999-9999',
    },
  });

  console.log('✅ User ready:', user.email);

  // Create or update test professional (vinculado ao estabelecimento)
  const professional = await prisma.professional.upsert({
    where: { 
      establishmentId_email: {
        establishmentId: establishment.id,
        email: 'maria@example.com'
      }
    },
    update: {},
    create: {
      id: randomUUID(),
      establishmentId: establishment.id,
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '(11) 88888-8888',
    },
  });

  console.log('✅ Professional ready:', professional.email);

  // Criar mais profissionais
  const professional2 = await prisma.professional.upsert({
    where: { 
      establishmentId_email: {
        establishmentId: establishment.id,
        email: 'ana@example.com'
      }
    },
    update: {},
    create: {
      id: randomUUID(),
      establishmentId: establishment.id,
      name: 'Ana Oliveira',
      email: 'ana@example.com',
      phone: '(11) 87777-7777',
    },
  });
  console.log('✅ Professional 2 ready:', professional2.email);

  const professional3 = await prisma.professional.upsert({
    where: { 
      establishmentId_email: {
        establishmentId: establishment.id,
        email: 'carlos@example.com'
      }
    },
    update: {},
    create: {
      id: randomUUID(),
      establishmentId: establishment.id,
      name: 'Carlos Souza',
      email: 'carlos@example.com',
      phone: '(11) 86666-6666',
    },
  });
  console.log('✅ Professional 3 ready:', professional3.email);

  // Limpar serviços antigos para recriar
  await prisma.service.deleteMany({
    where: { establishmentId: establishment.id }
  });

  // Criar múltiplos serviços
  const servicesData = [
    { prof: professional, name: 'Corte Feminino', desc: 'Corte de cabelo feminino com finalização', duration: 60, price: 80.0 },
    { prof: professional, name: 'Corte Masculino', desc: 'Corte de cabelo masculino', duration: 30, price: 50.0 },
    { prof: professional2, name: 'Escova', desc: 'Escova modeladora', duration: 45, price: 60.0 },
    { prof: professional2, name: 'Coloração', desc: 'Coloração completa do cabelo', duration: 120, price: 200.0 },
    { prof: professional3, name: 'Corte Masculino', desc: 'Corte masculino moderno', duration: 30, price: 45.0 },
    { prof: professional3, name: 'Manicure', desc: 'Manicure completa', duration: 45, price: 40.0 },
    { prof: professional3, name: 'Pedicure', desc: 'Pedicure completa', duration: 60, price: 50.0 },
  ];

  const services = await Promise.all(
    servicesData.map(s =>
      prisma.service.create({
        data: {
          id: randomUUID(),
          establishmentId: establishment.id,
          professionalId: s.prof.id,
          name: s.name,
          description: s.desc,
          durationMinutes: s.duration,
          price: s.price,
        },
      })
    )
  );
  console.log(`✅ Created ${services.length} services`);

  // Limpar produtos antigos
  await prisma.product.deleteMany({
    where: { establishmentId: establishment.id }
  });

  // Criar produtos
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: randomUUID(),
        establishmentId: establishment.id,
        professionalId: professional.id,
        name: 'Shampoo Premium',
        description: 'Shampoo de alta qualidade',
        price: 45.0,
        stock: 100,
      },
    }),
    prisma.product.create({
      data: {
        id: randomUUID(),
        establishmentId: establishment.id,
        professionalId: professional2.id,
        name: 'Condicionador',
        description: 'Condicionador hidratante',
        price: 40.0,
        stock: 80,
      },
    }),
    prisma.product.create({
      data: {
        id: randomUUID(),
        establishmentId: establishment.id,
        professionalId: professional2.id,
        name: 'Máscara Capilar',
        description: 'Máscara de hidratação profunda',
        price: 60.0,
        stock: 50,
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  // Limpar agendas antigas
  await prisma.schedule.deleteMany({
    where: { establishmentId: establishment.id }
  });

  // Criar agendas para todos os profissionais (seg a sáb)
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const allProfessionals = [professional, professional2, professional3];
  
  for (const prof of allProfessionals) {
    await Promise.all(
      daysOfWeek.map(day =>
        prisma.schedule.create({
          data: {
            id: randomUUID(),
            establishmentId: establishment.id,
            professionalId: prof.id,
            dayOfWeek: day as any,
            startTime: '09:00',
            endTime: day === 'SATURDAY' ? '14:00' : '18:00',
            isAvailable: true,
          },
        })
      )
    );
  }
  console.log(`✅ Created schedules for ${allProfessionals.length} professionals`);

  // Criar clientes de teste (usuários)
  const client1 = await prisma.user.upsert({
    where: {
      email: 'pedro.santos@example.com'
    },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Pedro Santos',
      email: 'pedro.santos@example.com',
      phone: '(11) 91111-1111',
    },
  });

  const client2 = await prisma.user.upsert({
    where: {
      email: 'julia.costa@example.com'
    },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Julia Costa',
      email: 'julia.costa@example.com',
      phone: '(11) 92222-2222',
    },
  });

  const client3 = await prisma.user.upsert({
    where: {
      email: 'marcos.lima@example.com'
    },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Marcos Lima',
      email: 'marcos.lima@example.com',
      phone: '(11) 93333-3333',
    },
  });

  console.log('✅ Created 3 test clients (users)');

  // Criar assinatura de teste para client1 (Pedro Santos)
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 1); // Expira em 1 mês

  // Como removemos a constraint unique, agora usamos create direto
  await prisma.clientSubscription.create({
    data: {
      id: randomUUID(),
      userId: client1.id,
      establishmentId: establishment.id,
      planName: 'Plano Mensal Premium',
      totalCredits: 10,
      usedCredits: 2,
      status: 'ACTIVE',
      expiresAt: expirationDate,
    },
  });

  console.log('✅ Created subscription for Pedro Santos (8 credits remaining)');

  // Criar vínculos usuário-estabelecimento
  await prisma.userEstablishment.upsert({
    where: {
      userId_establishmentId: {
        userId: client1.id,
        establishmentId: establishment.id,
      }
    },
    update: {},
    create: {
      userId: client1.id,
      establishmentId: establishment.id,
      firstAppointmentAt: new Date('2024-01-15'),
      lastAppointmentAt: new Date('2024-12-20'),
    },
  });

  await prisma.userEstablishment.upsert({
    where: {
      userId_establishmentId: {
        userId: client2.id,
        establishmentId: establishment.id,
      }
    },
    update: {},
    create: {
      userId: client2.id,
      establishmentId: establishment.id,
      firstAppointmentAt: new Date('2024-03-10'),
      lastAppointmentAt: new Date('2024-12-15'),
    },
  });

  console.log('✅ Created user-establishment links');

  // Criar alguns agendamentos passados e futuros
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      id: randomUUID(),
      userId: client1.id,
      establishmentId: establishment.id,
      professionalId: professional.id,
      serviceId: services[0].id, // Corte Feminino
      scheduledAt: tomorrow,
      durationMinutes: services[0].durationMinutes,
      status: 'CONFIRMED',
      price: services[0].price,
    },
  });

  await prisma.appointment.create({
    data: {
      id: randomUUID(),
      userId: client2.id,
      establishmentId: establishment.id,
      professionalId: professional2.id,
      serviceId: services[2].id, // Escova
      scheduledAt: nextWeek,
      durationMinutes: services[2].durationMinutes,
      status: 'CONFIRMED',
      price: services[2].price,
    },
  });

  console.log('✅ Created sample appointments');

  // Criar assinaturas de teste para diferentes planos
  const subscriptionFree = await prisma.subscription.upsert({
    where: { id: 'sub_free_001' },
    update: {},
    create: {
      id: 'sub_free_001',
      ownerId: owner.id,
      establishmentId: establishment.id,
      planType: 'FREE',
      status: 'ACTIVE',
      price: 0,
      platformFeePercent: 10, // 10% de comissão
      billingCycle: 'MONTHLY',
      startedAt: new Date(),
      trialEndsAt: null,
    },
  });

  console.log('✅ Created FREE plan subscription (10% commission, no monthly fee)');

  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📋 Dados de teste criados:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Dono: admin@agendei.com / senha123');
  console.log('🏢 Estabelecimento: Salão da Maria (slug: salao-da-maria)');
  console.log('💰 Pagamento: 30% de sinal requerido para agendamentos');
  console.log('💎 Plano: FREE (R$ 0/mês + 10% comissão por transação)');
  console.log('');
  console.log('👨‍💼 Profissionais:');
  console.log('  1. Maria Santos - maria@salao.com');
  console.log('  2. Ana Oliveira - ana@salao.com');
  console.log('  3. Carlos Souza - carlos@salao.com');
  console.log('');
  console.log('💈 Serviços:');
  console.log('  1. Corte Feminino - R$ 80,00 (60 min) - Maria Santos');
  console.log('  2. Corte Masculino - R$ 50,00 (30 min) - Maria Santos');
  console.log('  3. Corte Masculino - R$ 45,00 (30 min) - Carlos Souza');
  console.log('  4. Escova - R$ 60,00 (45 min) - Ana Oliveira');
  console.log('  5. Coloração - R$ 200,00 (120 min) - Ana Oliveira');
  console.log('  6. Manicure - R$ 40,00 (45 min) - Carlos Souza');
  console.log('  7. Pedicure - R$ 50,00 (60 min) - Carlos Souza');
  console.log('');
  console.log('📦 Produtos:');
  console.log('  1. Shampoo Premium - R$ 50,00 (estoque: 50)');
  console.log('  2. Condicionador - R$ 45,00 (estoque: 50)');
  console.log('  3. Máscara Capilar - R$ 80,00 (estoque: 30)');
  console.log('');
  console.log('🧑 Clientes:');
  console.log('  1. Pedro Santos - pedro.santos@example.com (Assinatura Ativa - 8 créditos)');
  console.log('  2. Julia Costa - julia.costa@example.com');
  console.log('  3. Marcos Lima - marcos.lima@example.com');
  console.log('');
  console.log('📅 Horários:');
  console.log('  Segunda a Sexta: 9h às 18h');
  console.log('  Sábado: 9h às 14h');
  console.log('🔗 URL: http://localhost:3000/salao-da-maria');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
