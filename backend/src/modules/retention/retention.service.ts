import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async nullifyOldGpsData() {
    this.logger.log('Starting KVKK data retention job for GPS coordinates...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await this.prisma.scanEvent.updateMany({
      where: {
        serverReceivedAt: { lt: cutoffDate },
        OR: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      data: {
        latitude: null,
        longitude: null,
        accuracyM: null
      }
    });

    this.logger.log(`Nullified GPS data for ${result.count} scan events older than 90 days.`);
  }
}
