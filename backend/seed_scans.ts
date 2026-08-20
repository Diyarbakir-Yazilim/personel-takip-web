import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

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
  const task = await prisma.taskInstance.findFirst();

  if (!user || !task) {
    console.log('No user or task found');
    return;
  }

  // Create a CHECK_IN scan
  await prisma.scanEvent.create({
    data: {
      idempotencyKey: crypto.randomUUID(),
      clientEventId: crypto.randomUUID(),
      userId: user.id,
      taskId: task.id,
      token: 'fake-qr-code-123',
      requestedAction: 'CHECK_IN',
      resolvedAction: 'CHECK_IN',
      method: 'DYNAMIC_QR',
      clientScannedAt: new Date(Date.now() - 3600000), // 1 hour ago
      riskScore: 0,
    }
  });

  // Create a CHECK_OUT scan
  await prisma.scanEvent.create({
    data: {
      idempotencyKey: crypto.randomUUID(),
      clientEventId: crypto.randomUUID(),
      userId: user.id,
      taskId: task.id,
      token: 'fake-qr-code-123',
      requestedAction: 'CHECK_OUT',
      resolvedAction: 'CHECK_OUT',
      method: 'DYNAMIC_QR',
      clientScannedAt: new Date(),
      riskScore: 0,
    }
  });

  console.log('Created fake scan events for testing.');
  await pool.end();
}

main().finally(() => prisma.$disconnect());
