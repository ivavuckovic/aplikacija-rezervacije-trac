import { PrismaClient, Prisma } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database A.1...');

  // ── Salon Info ──────────────────────────────────
  await prisma.salonInfo.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      naziv:        'Salon Lepote Trač',
      lokacija:     'Bulevar Oslobođenja 42, Novi Sad',
      opis:         'Dobrodošli u Salon Trač — vaše oazom lepote i opuštanja u srcu Novog Sada. Nudimo vrhunske usluge masaže, tretmana lica i njege tela.',
      radnoVremeOd: '09:00',
      radnoVremeDo: '21:00',
    },
  });
  console.log('✅ SalonInfo seeded');

  // ── Allowed Currencies ──────────────────────────
  const currencies = [
    { code: 'RSD', naziv: 'Srpski dinar' },
    { code: 'EUR', naziv: 'Euro' },
    { code: 'USD', naziv: 'Američki dolar' },
    { code: 'GBP', naziv: 'Britanska funta' },
    { code: 'CHF', naziv: 'Švajcarski franak' },
  ];

  for (const currency of currencies) {
    await prisma.allowedCurrency.upsert({
      where:  { code: currency.code },
      update: {},
      create: currency,
    });
  }
  console.log('✅ Currencies seeded');

  // ── Discount Config ─────────────────────────────
  await prisma.discountConfig.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      discountPercentage: new Prisma.Decimal('10.00'),
      validUntil:         new Date('2025-12-31'),
      isActive:           true,
    },
  });
  console.log('✅ DiscountConfig seeded');

  // ── Service Categories ──────────────────────────
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where:  { naziv: 'Masaže' },
      update: {},
      create: { naziv: 'Masaže', opis: 'Različite vrste terapeutskih i relaksacionih masaža' },
    }),
    prisma.serviceCategory.upsert({
      where:  { naziv: 'Tretmani lica' },
      update: {},
      create: { naziv: 'Tretmani lica', opis: 'Profesionalni tretmani za negu i podmlađivanje lica' },
    }),
    prisma.serviceCategory.upsert({
      where:  { naziv: 'Manikir i pedikir' },
      update: {},
      create: { naziv: 'Manikir i pedikir', opis: 'Kompletna nega noktiju ruku i nogu' },
    }),
    prisma.serviceCategory.upsert({
      where:  { naziv: 'Depilacija' },
      update: {},
      create: { naziv: 'Depilacija', opis: 'Vaks depilacija i epilacija svih partija tela' },
    }),
  ]);
  console.log('✅ ServiceCategories seeded');

  // ── Services ────────────────────────────────────
  const services = [
    // Masaže
    {
      categoryId:               categories[0].id,
      naziv:                    'Klasična masaža celog tela',
      opis:                     'Opuštajuća masaža celog tela u trajanju od 60 minuta',
      trajanjeMin:              60,
      maxKlijenataPoTerminu:    2,
      vremePocetkaPrvogTermina: '09:00',
      vremeZavrsetkaPoslednjeg: '20:00',
      cenaRsd:                  new Prisma.Decimal('4500.00'),
    },
    {
      categoryId:               categories[0].id,
      naziv:                    'Masaža leđa i vrata',
      opis:                     'Ciljana masaža leđa, vrata i ramenog pojasa',
      trajanjeMin:              30,
      maxKlijenataPoTerminu:    3,
      vremePocetkaPrvogTermina: '09:00',
      vremeZavrsetkaPoslednjeg: '20:30',
      cenaRsd:                  new Prisma.Decimal('2500.00'),
    },
    // Tretmani lica
    {
      categoryId:               categories[1].id,
      naziv:                    'Dubinsko čišćenje lica',
      opis:                     'Profesionalno čišćenje pora i revitalizacija kože lica',
      trajanjeMin:              60,
      maxKlijenataPoTerminu:    1,
      vremePocetkaPrvogTermina: '10:00',
      vremeZavrsetkaPoslednjeg: '19:00',
      cenaRsd:                  new Prisma.Decimal('3800.00'),
    },
    {
      categoryId:               categories[1].id,
      naziv:                    'Anti-aging tretman',
      opis:                     'Tretman za podmlađivanje i zatezanje kože lica',
      trajanjeMin:              90,
      maxKlijenataPoTerminu:    1,
      vremePocetkaPrvogTermina: '09:00',
      vremeZavrsetkaPoslednjeg: '18:30',
      cenaRsd:                  new Prisma.Decimal('6500.00'),
    },
    // Manikir i pedikir
    {
      categoryId:               categories[2].id,
      naziv:                    'Manikir sa lakiranjem',
      opis:                     'Kompletna nega noktiju ruku sa lakiranjem gel lakom',
      trajanjeMin:              45,
      maxKlijenataPoTerminu:    2,
      vremePocetkaPrvogTermina: '09:00',
      vremeZavrsetkaPoslednjeg: '20:15',
      cenaRsd:                  new Prisma.Decimal('2200.00'),
    },
    // Depilacija
    {
      categoryId:               categories[3].id,
      naziv:                    'Depilacija nogu',
      opis:                     'Vaks depilacija celih nogu',
      trajanjeMin:              45,
      maxKlijenataPoTerminu:    2,
      vremePocetkaPrvogTermina: '09:00',
      vremeZavrsetkaPoslednjeg: '20:15',
      cenaRsd:                  new Prisma.Decimal('2800.00'),
    },
  ];

  for (const service of services) {
    await prisma.service.create({ data: service }).catch(() => {
      // Skip if already exists
    });
  }
  console.log('✅ Services seeded');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
