import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database (Arabic catalog)...');

  const adminHash = await bcrypt.hash('Admin1234', 12);
  await prisma.user.upsert({
    where: { email: 'admin@cakeshop.dev' },
    update: { passwordHash: adminHash, role: 'admin' },
    create: {
      name: 'مدير المتجر',
      email: 'admin@cakeshop.dev',
      phone: '+10000000001',
      passwordHash: adminHash,
      role: 'admin',
    },
  });

  const customerHash = await bcrypt.hash('Customer1234', 12);
  await prisma.user.upsert({
    where: { email: 'customer@cakeshop.dev' },
    update: { passwordHash: customerHash },
    create: {
      name: 'عميلة تجريبية',
      email: 'customer@cakeshop.dev',
      phone: '+10000000002',
      passwordHash: customerHash,
      role: 'customer',
    },
  });

  // Shapes (round + square only; drop heart per frontend spec)
  for (const s of [
    { name: 'round',  priceModifier: 15, modelAssetUrl: '/models/round.glb'  },
    { name: 'square', priceModifier: 16, modelAssetUrl: '/models/square.glb' },
  ]) {
    await prisma.shape.upsert({ where: { name: s.name }, update: { priceModifier: s.priceModifier }, create: s });
  }
  // Clean up heart shape if it exists from a previous seed
  await prisma.shape.deleteMany({ where: { name: 'heart' } }).catch(() => {});

  for (const f of [
    { name: 'vanilla',    priceModifier: 2   },
    { name: 'chocolate',  priceModifier: 3   },
    { name: 'strawberry', priceModifier: 3   },
    { name: 'red-velvet', priceModifier: 4   },
    { name: 'lemon',      priceModifier: 3   },
    { name: 'coffee',     priceModifier: 3.5 },
  ]) {
    await prisma.flavor.upsert({ where: { name: f.name }, update: { priceModifier: f.priceModifier }, create: f });
  }

  for (const t of [
    { name: 'sprinkles',       price: 1   },
    { name: 'chocolate-chips', price: 1.5 },
    { name: 'berries',         price: 2.5 },
    { name: 'gold-flakes',     price: 5   },
    { name: 'caramel',         price: 2   },
  ]) {
    await prisma.topping.upsert({ where: { name: t.name }, update: { price: t.price }, create: t });
  }

  // Arabic cake catalog (mirrors test_ui/index.html:1585-1594)
  const arabicCakes = [
    { name: 'بيري فلفت',         description: 'إسفنج توت أحمر مع كريمة ماسكاربوني وأوراق ورد.',           basePrice: 48, category: 'fruit',     tag: 'جديد',           gradient: '#FBCFE2|#9D174D' },
    { name: 'كاكاو منتصف الليل', description: 'ثلاث طبقات شوكولاتة بلجيكية داكنة وقطرات غاناش مالحة.',   basePrice: 52, category: 'chocolate', tag: 'الأكثر طلباً',   gradient: '#1F0A14|#5B2840' },
    { name: 'سحابة النعناع',     description: 'موس نعناع طازج، رقائق شوكولاتة داكنة، إسفنج فانيليا.',    basePrice: 46, category: 'chocolate', tag: null,             gradient: '#99F6E4|#0F766E' },
    { name: 'فستق وورد',         description: 'إسفنج فارسي بكريمة ماء الورد والفستق المطحون.',           basePrice: 56, category: 'nut',       tag: 'مميزة',          gradient: '#A7F3D0|#84CC16' },
    { name: 'ليمون درزل',        description: 'إسفنج حمضي منعش مع بذور الخشخاش وقطرات الليمون.',         basePrice: 38, category: 'gf',        tag: 'بدون غلوتين',    gradient: '#FEF3C7|#F59E0B' },
    { name: 'برالين البندق',     description: 'كيكة زبدة بنية، برالين بندق، رقائق ذهب.',                 basePrice: 58, category: 'nut',       tag: 'محدود',          gradient: '#FDE68A|#92400E' },
    { name: 'سحابة الفراولة',    description: 'طبقات فانيليا ناعمة مع توت طازج وكريمة.',                  basePrice: 44, category: 'fruit',     tag: null,             gradient: '#FCA5A5|#DC2626' },
    { name: 'جوز هند وليمون',    description: 'إسفنج جوز هند محمص، خثارة ليمون، كريمة بيضاء.',           basePrice: 42, category: 'gf',        tag: 'بدون غلوتين',    gradient: '#D1FAE5|#0F766E' },
  ];

  // Wipe old English cakes and reseed
  await prisma.cake.deleteMany({});
  for (let i = 0; i < arabicCakes.length; i++) {
    const c = arabicCakes[i];
    await prisma.cake.create({
      data: { ...c, imageUrl: '', isActive: true, displayOrder: i },
    });
  }

  console.log('Seed complete!');
  console.log('  Admin login:    admin@cakeshop.dev    / Admin1234');
  console.log('  Customer login: customer@cakeshop.dev / Customer1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
