import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'dtso',
  password: process.env.DB_PASSWORD || 'dtso',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'personel_takip_db',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'STAFF' } });
  const zone = await prisma.zone.findFirst();

  if (!user || !zone) {
    console.log('No user or zone found');
    return;
  }

  const task = await prisma.taskInstance.create({
    data: {
      userId: user.id,
      zoneId: zone.id,
      scheduledFor: new Date(),
      status: 'SCHEDULED',
      checklist: ['Zemin temizliği', 'Çöplerin atılması']
    }
  });
  console.log('Created task for user:', user.fullName, 'in zone:', zone.name);
  await pool.end();
}

main().finally(() => prisma.$disconnect());
