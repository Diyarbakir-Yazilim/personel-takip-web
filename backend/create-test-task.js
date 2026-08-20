require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'STAFF' } });
  if (users.length === 0) {
    console.log('No staff found.');
    return;
  }
  const staff = users[0];

  const zones = await prisma.zone.findMany();
  if (zones.length === 0) {
    console.log('No zones found.');
    return;
  }
  const zone = zones[0];

  const task = await prisma.taskInstance.create({
    data: {
      userId: staff.id,
      zoneId: zone.id,
      status: 'SCHEDULED',
      scheduledFor: new Date(),
      checklist: ['Çöpleri boşalt', 'Yerleri sil', 'Aynaları temizle'],
    }
  });

  console.log('Test task created:', task);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
