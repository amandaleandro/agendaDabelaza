#!/usr/bin/env node

/**
 * Script para testar o setup do sistema
 * - Verifica profissionais
 * - Verifica serviços
 * - Verifica schedules
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing API Setup...\n');
  console.log(`Using API_BASE_URL: ${API_BASE_URL}\n`);

  try {
    // 1. Buscar estabelecimentos
    console.log('1️⃣ Fetching establishments from public API...');
    const estRes = await fetch(`${API_BASE_URL}/public/establishments/salao-da-maria`);
    if (!estRes.ok) {
      console.error('   ❌ Failed to fetch establishment');
      return;
    }
    const est = await estRes.json();
    console.log(`   ✅ Found establishment: ${est.name} (slug: ${est.slug})`);
    const establishmentId = est.id;

    // 2. Buscar profissionais
    console.log('\n2️⃣ Fetching professionals...');
    const proRes = await fetch(`${API_BASE_URL}/public/establishments/salao-da-maria/professionals`);
    if (!proRes.ok) {
      console.error('   ❌ Failed to fetch professionals');
      return;
    }
    const professionals = await proRes.json();
    if (professionals.length === 0) {
      console.error('   ❌ No professionals found. Please create at least one professional.');
      return;
    }
    console.log(`   ✅ Found ${professionals.length} professionals:`);
    professionals.forEach(p => console.log(`      - ${p.name} (${p.id})`));
    const professionalId = professionals[0].id;

    // 3. Buscar serviços
    console.log('\n3️⃣ Fetching services...');
    const servRes = await fetch(`${API_BASE_URL}/public/establishments/salao-da-maria/services`);
    if (!servRes.ok) {
      console.error('   ❌ Failed to fetch services');
      return;
    }
    const services = await servRes.json();
    if (services.length === 0) {
      console.error('   ❌ No services found. Please create at least one service.');
      console.log('\n   To create a service, POST to:', `${API_BASE_URL}/professionals/{professionalId}/services`);
      console.log('   With body: { "establishmentId": "...", "name": "...", "price": 100, "durationMinutes": 60 }');
      return;
    }
    console.log(`   ✅ Found ${services.length} services:`);
    services.forEach(s => console.log(`      - ${s.name}: R$ ${s.price} (${s.durationMinutes}min) - prof: ${s.professionalId}`));
    const serviceId = services[0].id;

    // 4. Buscar schedules
    console.log('\n4️⃣ Fetching schedules...');
    const schedRes = await fetch(`${API_BASE_URL}/public/establishments/salao-da-maria/schedules?professionalId=${professionalId}`);
    if (!schedRes.ok) {
      console.error('   ❌ Failed to fetch schedules');
      return;
    }
    const schedules = await schedRes.json();
    if (schedules.length === 0) {
      console.error('   ❌ No schedules found for professional. Schedules should be auto-created when professional is created.');
      return;
    }
    console.log(`   ✅ Found ${schedules.length} schedules:`);
    schedules.forEach(s => console.log(`      - ${s.dayOfWeek}: ${s.startTime} - ${s.endTime} (available: ${s.isAvailable})`));

    // 5. Testar available-slots
    console.log('\n5️⃣ Testing available-slots endpoint...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const slotsRes = await fetch(`${API_BASE_URL}/public/appointments/available-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        establishmentSlug: 'salao-da-maria',
        date: dateStr,
        services: [{ serviceId, professionalId }]
      })
    });

    if (!slotsRes.ok) {
      console.error('   ❌ Failed to fetch available slots');
      const error = await slotsRes.json();
      console.error('   Error:', error);
      return;
    }

    const slots = await slotsRes.json();
    if (slots.length === 0) {
      console.error(`   ⚠️  No available slots found for ${dateStr}`);
      console.log('   This is the issue! Please check:');
      console.log('   1. Professional has active schedules for this day of week');
      console.log('   2. Schedules are set as isAvailable: true');
      console.log('   3. Service duration is within schedule time range');
    } else {
      console.log(`   ✅ Found ${slots.length} available slots for ${dateStr}:`);
      slots.slice(0, 5).forEach(s => console.log(`      - ${s}`));
      if (slots.length > 5) console.log(`      ... and ${slots.length - 5} more`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
